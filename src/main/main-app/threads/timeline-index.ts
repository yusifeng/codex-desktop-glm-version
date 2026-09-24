// ThreadItemIndex —— timeline/活动/进度索引（原版 g_e，33,604-33,857）。
//
// 用两个 WeakMap（timelinePositions / indexes）为 conversation 维护增量
// 索引，避免每次 patch 全量重建：
//   - timelinePositions：itemTimeline.entries → 下标（key = Hg 稳定 key）。
//     patch 只对 entries 数组的数字下标做 add/replace 时按 patch 增量搬移
//     位置映射，否则作废重建；
//   - indexes：conversation → { status, activity, createdThreadCalls,
//     progress, positions }。patch 无 history/无 patches（快照替换）时按
//     「turns 引用未变」判定可复用；否则按 patch path 增量更新各 turn 的
//     索引（items 数字下标且 item id/type 匹配才增量，否则整 turn 重建）。
//
// readStatus 的 pendingRequest 由 threads/projection（尚未重写）提供。

import { lastTurn, timelineEntryKey, type AnyTurn, type ConversationLike } from "../turns/canonical-history";
import { AUTOMATION_DETECTOR } from "./automation-detector";
// mv（pendingRequest 计算）：定义于状态投影簇（32,988-33,603，尚未重写）。
import { mv as computePendingRequest } from "./projection";

/** 索引访问器（ThreadStore 提供的实体读取面）。 */
export interface ThreadItemIndexAccess {
  getEntityKeys(conversation: ConversationLike): string[];
  getTurn(conversation: ConversationLike | null, entityKey: string): AnyTurn | null;
  parseUrl: (url: string) => any;
}

/** 瞬态/终态 item（索引中只记位置，不进活动/进度，原版 _v）。 */
export function isTerminalTransientItem(item: any): boolean {
  return (
    item.type === `error` ||
    item.type === `userInputResponse` ||
    item.type === `planImplementation` ||
    item.type === `fileChange`
  );
}

/** userMessage 谓词（原版 __e）。 */
export function isUserMessageItem(item: any): boolean {
  return item.type === `userMessage`;
}

/** agentMessage 谓词（原版 Sv，与 item-merge 的 Tg 同义）。 */
export function isAgentMessageItem(item: any): boolean {
  return item.type === `agentMessage`;
}

/** 活动 item：collab/subagent 活动横幅（原版 yv）。 */
export function isActivityItem(item: any): boolean {
  return item.type === `collabAgentToolCall` || item.type === `subAgentActivity`;
}

/** create_thread 工具调用（codex_app 命名空间，原版 bv）。 */
export function isCreateThreadCall(item: any): boolean {
  return (
    (item.type === `dynamicToolCall` &&
      `namespace` in item &&
      item.namespace === `codex_app` &&
      `tool` in item &&
      item.tool === `create_thread`) ||
    (item.type === `mcpToolCall` &&
      `server` in item &&
      item.server === `codex_app` &&
      `tool` in item &&
      item.tool === `create_thread`) ||
    false
  );
}

/** reasoning item（原版 xv）。 */
export function isReasoningItem(item: any): boolean {
  return item.type === `reasoning`;
}

/** item 是否 automation 生成（原版 vv：agentMessage 走心跳判定，
 *  userMessage 走 automation userInput 解析）。 */
export function isAutomationItem(item: any): boolean {
  return isAgentMessageItem(item)
    ? AUTOMATION_DETECTOR.isAutomationAssistantMessage(item.text)
    : isUserMessageItem(item) && AUTOMATION_DETECTOR.isAutomationUserInput(item.content);
}

/** 每 turn 的索引结构。 */
interface TurnIndex {
  status: { pendingRequest: any; latestTurnError: any };
  transcriptIndexed: boolean;
  activity: Record<string, any[]>;
  createdThreadCalls: Record<string, any[]>;
  progress: Record<
    string,
    { latestReasoning: { item: any; previous: any } | null; lastAssistantMessage: any } | undefined
  >;
  positions: Map<string, Map<string, number>>;
}

/** timeline / 活动 / 进度索引。 */
export class ThreadItemIndex {
  private access: ThreadItemIndexAccess;
  private timelinePositions = new WeakMap<any, Map<string, number>>();

  constructor(access: ThreadItemIndexAccess) {
    this.access = access;
  }

  /** timeline 条目下标（惰性建表，原版 timelinePosition）。 */
  timelinePosition(timeline: any, key: string): number | undefined {
    if (timeline == null) return;
    let positions = this.timelinePositions.get(timeline);
    if (positions == null) {
      positions = new Map(timeline.entries.map((entry: any, index: number) => [timelineEntryKey(entry), index]));
      this.timelinePositions.set(timeline, positions);
    }
    return positions.get(key);
  }

  private indexes = new WeakMap<ConversationLike, TurnIndex>();

  status(conversation: ConversationLike | null): any {
    return conversation == null ? null : this.get(conversation, false).status;
  }

  activity(conversation: ConversationLike | null): Record<string, any[]> {
    return conversation == null ? null : this.get(conversation).activity;
  }

  createdThreadCalls(conversation: ConversationLike | null): Record<string, any[]> {
    return conversation == null ? null : this.get(conversation).createdThreadCalls;
  }

  progress(conversation: ConversationLike | null): any {
    return conversation == null ? null : this.get(conversation).progress;
  }

  /**
   * patch 后增量更新（原版 update）。
   *
   * @param previous patch 前的 conversation（可能为 null）
   * @param next patch 后的 conversation
   * @param patches immer patches（null 表示快照替换）
   * @param changedItems 变更的 {entityKey, itemId} 列表
   */
  update(
    previous: ConversationLike | null,
    next: ConversationLike,
    patches: any[] | null,
    changedItems: { entityKey: string; itemId: string }[] | null,
  ): void {
    // 1) timeline 位置表增量搬移（entries 数字下标的 add/replace patch）。
    let previousTimeline = (previous as any)?.itemTimeline;
    let nextTimeline = (next as any).itemTimeline;
    let previousTimelinePositions =
      previousTimeline == null ? void 0 : this.timelinePositions.get(previousTimeline);
    if (
      previousTimeline != null &&
      nextTimeline != null &&
      previousTimeline !== nextTimeline &&
      previousTimelinePositions != null
    ) {
      let timelinePatches = patches?.filter(({ path }) => path[0] === `itemTimeline`);
      if (
        timelinePatches?.length &&
        timelinePatches.every(
          ({ op, path }) => op !== `remove` && path[1] === `entries` && typeof path[2] == `number`,
        )
      ) {
        this.timelinePositions.delete(previousTimeline);
        for (let { path } of timelinePatches) {
          let index = path[2];
          if (typeof index == `number`) {
            let oldEntry = previousTimeline.entries[index];
            if (oldEntry != null) previousTimelinePositions.delete(timelineEntryKey(oldEntry));
            previousTimelinePositions.set(timelineEntryKey(nextTimeline.entries[index]), index);
          }
        }
        this.timelinePositions.set(nextTimeline, previousTimelinePositions);
      }
    }

    // 2) conversation 索引增量/重建。
    let previousIndex = previous == null ? void 0 : this.indexes.get(previous);
    if (previousIndex == null || previous == null) return;
    if (patches == null && changedItems == null) {
      // 快照替换：turns 引用未变（canonical 看 entitiesByKey/islands/turns
      // 引用，legacy 看 turns 引用）则复用索引（requests 变了只重读 status）。
      if (
        !(previous.turnHistory?.kind === `canonical`
          ? next.turnHistory?.kind === `canonical` &&
            (previous.turnHistory as any).history.entitiesByKey ===
              (next.turnHistory as any).history.entitiesByKey &&
            (previous.turnHistory as any).history.islands ===
              (next.turnHistory as any).history.islands &&
            previous.turns === next.turns
          : next.turnHistory?.kind !== `canonical` && previous.turns === next.turns)
      ) {
        this.indexes.set(next, this.build(next, previousIndex.transcriptIndexed));
        return;
      }
      this.indexes.set(
        next,
        previous.requests === next.requests
          ? previousIndex
          : { ...previousIndex, status: this.readStatus(next) },
      );
      return;
    }
    // patch 路径：收集涉及的 (entityKey, itemIndex)，requests 引用变化需重读 status。
    let statusChanged = previous.requests !== next.requests;
    let touchedPositions = new Map<string, Set<number>>();
    let markTouched = (entityKey: string, itemIndex: number) => {
      let indexes = touchedPositions.get(entityKey);
      if (indexes == null) {
        indexes = new Set();
        touchedPositions.set(entityKey, indexes);
      }
      indexes.add(itemIndex);
    };
    for (let { entityKey, itemId } of changedItems ?? []) {
      let itemIndex = previousIndex.positions.get(entityKey)?.get(itemId);
      if (itemIndex != null) markTouched(entityKey, itemIndex);
    }
    for (let { op, path } of patches ?? []) {
      let entityKey: string;
      let itemsPathIndex: number;
      if (path[0] === `turns`) {
        if (next.turnHistory?.kind === `canonical`) {
          // canonical：本地 turns 数组的 items patch（本地占位 turn）。
          let turnIndex = path[1];
          let itemIndex = path[3];
          if (typeof turnIndex == `number` && path[2] === `items` && typeof itemIndex == `number`) {
            let nextItem = next.turns[turnIndex]?.items[itemIndex];
            let previousItem = previous.turns[turnIndex]?.items[itemIndex];
            statusChanged =
              statusChanged ||
              (nextItem != null && isTerminalTransientItem(nextItem)) ||
              (previousItem != null && isTerminalTransientItem(previousItem));
          } else statusChanged = true;
          continue;
        }
        // legacy：turns[i] 的 patch；非 items 下标路径 → 整体重建。
        let turnIndex = path[1];
        if (typeof turnIndex != `number` || path.length < 3 || path[2] === `turnId`) return;
        let turn = next.turns[turnIndex] ?? previous.turns[turnIndex];
        if (turn == null) return;
        entityKey = turn.turnId == null ? `legacy:${turnIndex}` : `turn:${turn.turnId}`;
        itemsPathIndex = 2;
      } else if (path[0] === `turnHistory`) {
        // canonical：entitiesByKey[key] 的 patch。
        if (
          path[1] !== `history` ||
          path[2] !== `entitiesByKey` ||
          typeof path[3] != `string` ||
          path.length < 5
        )
          return;
        entityKey = path[3];
        itemsPathIndex = 4;
      } else continue;
      if (path[itemsPathIndex] !== `items`) {
        statusChanged = true;
        continue;
      }
      let itemIndex = path[itemsPathIndex + 1];
      if (typeof itemIndex != `number` || op === `remove`) return;
      markTouched(entityKey, itemIndex);
    }
    let nextIndex: TurnIndex = { ...previousIndex };
    for (let [entityKey, itemIndexes] of touchedPositions) {
      let previousTurn = this.access.getTurn(previous, entityKey);
      let nextTurn = this.access.getTurn(next, entityKey);
      let positions = previousIndex.positions.get(entityKey);
      if (nextTurn == null || previousTurn == null || positions == null) return;
      for (let itemIndex of itemIndexes) {
        let nextItem = nextTurn.items[itemIndex];
        let previousItem = previousTurn.items[itemIndex];
        // 下标处 item 漂移（id/type 不匹配）→ 整 turn 重建。
        if (
          nextItem == null ||
          (previousItem != null && (previousItem.id !== nextItem.id || previousItem.type !== nextItem.type))
        ) {
          this.replaceTurn(nextIndex, entityKey, nextTurn);
          statusChanged = true;
          break;
        }
        if (
          (isTerminalTransientItem(nextItem) || (previousItem != null && isTerminalTransientItem(previousItem))) &&
            ((statusChanged = true), positions.set(nextItem.id, itemIndex)),
          next.turnHistory?.kind === `canonical` &&
            nextTurn.status === `completed` &&
            isAutomationItem(nextItem) !== (previousItem != null && isAutomationItem(previousItem)) &&
            (statusChanged = true),
          nextItem.type === `userMessage` && positions.set(nextItem.id, itemIndex),
          !previousIndex.transcriptIndexed
        ) {
          if (isAgentMessageItem(nextItem)) positions.set(nextItem.id, itemIndex);
          continue;
        }
        if (isActivityItem(nextItem)) {
          let activity = nextIndex.activity[entityKey] ?? [];
          let updated =
            previousItem == null
              ? [...activity, nextItem]
              : activity.map((item) => (item.id === nextItem.id ? nextItem : item));
          nextIndex.activity = { ...nextIndex.activity, [entityKey]: updated };
          positions.set(nextItem.id, itemIndex);
        } else if (isCreateThreadCall(nextItem)) {
          let calls = nextIndex.createdThreadCalls[entityKey] ?? [];
          nextIndex.createdThreadCalls = {
            ...nextIndex.createdThreadCalls,
            [entityKey]:
              previousItem == null
                ? [...calls, nextItem]
                : calls.map((item) => (item.id === nextItem.id ? nextItem : item)),
          };
          positions.set(nextItem.id, itemIndex);
        } else if (isReasoningItem(nextItem)) {
          // reasoning 链表头插：与已有链头 id 不同说明下标漂移 → 整 turn 重建。
          let progress = nextIndex.progress[entityKey];
          if (previousItem != null && progress?.latestReasoning?.item.id !== nextItem.id) {
            this.replaceTurn(nextIndex, entityKey, nextTurn);
            break;
          }
          let previousReasoning =
            previousItem == null
              ? (progress?.latestReasoning ?? null)
              : (progress?.latestReasoning?.previous ?? null);
          nextIndex.progress = {
            ...nextIndex.progress,
            [entityKey]: {
              latestReasoning: { item: nextItem, previous: previousReasoning },
              lastAssistantMessage: progress?.lastAssistantMessage ?? null,
            },
          };
          positions.set(nextItem.id, itemIndex);
        } else if (isAgentMessageItem(nextItem)) {
          // agentMessage：新 item 或 phase 变化（流式 delta）→ 记为最后一条。
          let progress = nextIndex.progress[entityKey];
          if (
            previousItem == null ||
            (progress?.lastAssistantMessage?.id === nextItem.id &&
              progress.lastAssistantMessage.phase !== nextItem.phase)
          )
            nextIndex.progress = {
              ...nextIndex.progress,
              [entityKey]: {
                latestReasoning: progress?.latestReasoning ?? null,
                lastAssistantMessage: nextItem,
              },
            };
          positions.set(nextItem.id, itemIndex);
        }
      }
    }
    if (statusChanged) nextIndex.status = this.readStatus(next);
    this.indexes.set(next, nextIndex);
  }

  /** 取索引（transcript 未索引时按需重建，原版 get）。 */
  private get(conversation: ConversationLike, indexTranscript: boolean = true): TurnIndex {
    let index = this.indexes.get(conversation);
    if (index == null || (indexTranscript && !index.transcriptIndexed)) {
      index = this.build(conversation, indexTranscript);
      this.indexes.set(conversation, index);
    }
    return index;
  }

  /** 全量重建（原版 build）。 */
  private build(conversation: ConversationLike, indexTranscript: boolean): TurnIndex {
    let index: TurnIndex = {
      status: this.readStatus(conversation),
      transcriptIndexed: indexTranscript,
      activity: {},
      createdThreadCalls: {},
      progress: {},
      positions: new Map(),
    };
    for (let entityKey of this.access.getEntityKeys(conversation)) {
      let turn = this.access.getTurn(conversation, entityKey);
      if (turn != null) this.indexTurn(index, entityKey, turn);
    }
    return index;
  }

  /** 会话状态（原版 readStatus）：pendingRequest（projection 提供）+ 末 turn
   *  的最后一个不重试 error。 */
  private readStatus(conversation: ConversationLike): any {
    let items = lastTurn(conversation)?.items;
    let latestTurnError = null;
    for (let index = (items?.length ?? 0) - 1; index >= 0; --index) {
      let item = items?.[index];
      if (
        item?.type === `error` &&
        `willRetry` in item &&
        !item.willRetry &&
        `message` in item &&
        `errorInfo` in item
      ) {
        latestTurnError = { message: item.message, errorInfo: item.errorInfo, willRetry: item.willRetry };
        break;
      }
    }
    return {
      pendingRequest: computePendingRequest(conversation, this.access.parseUrl),
      latestTurnError,
    };
  }

  /** 重建单 turn 的索引项（原版 replaceTurn）。 */
  private replaceTurn(index: TurnIndex, entityKey: string, turn: AnyTurn): void {
    index.activity = { ...index.activity };
    delete index.activity[entityKey];
    index.createdThreadCalls = { ...index.createdThreadCalls };
    delete index.createdThreadCalls[entityKey];
    index.progress = { ...index.progress };
    delete index.progress[entityKey];
    this.indexTurn(index, entityKey, turn);
  }

  /** 索引单个 turn（原版 indexTurn）：位置表 + 活动/建线程调用/进度链。 */
  private indexTurn(index: TurnIndex, entityKey: string, turn: AnyTurn): void {
    let activity: any[] = [];
    let createdThreadCalls: any[] = [];
    let itemPositions = new Map<string, number>();
    let latestReasoning: { item: any; previous: any } | null = null;
    let lastAssistantMessage: any = null;
    for (let [itemIndex, item] of turn.items.entries())
      if (item != null) {
        if (
          ((isTerminalTransientItem(item) || item.type === `userMessage`) &&
            itemPositions.set(item.id, itemIndex),
          !index.transcriptIndexed)
        ) {
          if (isAgentMessageItem(item)) itemPositions.set(item.id, itemIndex);
          continue;
        }
        if (isActivityItem(item)) activity.push(item);
        else if (isCreateThreadCall(item)) createdThreadCalls.push(item);
        else if (isReasoningItem(item)) latestReasoning = { item, previous: latestReasoning };
        else if (isAgentMessageItem(item)) lastAssistantMessage = item;
        else continue;
        itemPositions.set(item.id, itemIndex);
      }
    index.positions.set(entityKey, itemPositions);
    if (activity.length > 0) index.activity[entityKey] = activity;
    if (createdThreadCalls.length > 0) index.createdThreadCalls[entityKey] = createdThreadCalls;
    if (latestReasoning != null || lastAssistantMessage != null)
      index.progress[entityKey] = { latestReasoning, lastAssistantMessage };
  }
}
