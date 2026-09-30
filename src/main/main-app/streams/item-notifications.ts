// ItemNotificationHandler —— app-server 流式 delta/终端通知 → 状态应用。
//
// 原版 main-C-Mhak1n.ts 39,470-39,826（Rve）+ 39,827-39,835（zve）。
//
// handleNotification 的 delta 类方法只入队（帧分/定时队列），flush 时按
// conversationId 分组批量应用（updateConversationState，附带
// acceptedTranscriptText/knownChangedItems/knownHistoryInvalidation 供
// patch 广播与索引增量）；terminalInteraction 同步应用（终端输入控制
// 字符解析）；fileChange/patchUpdated 直接更新 turn 上的 fileChange item。

import { $u as normalizeThreadId } from "@chunk/shared";
import { freezeIdentity } from "../vendor/immer";
import {
  exhaustedTailIsland,
  findDraftTurn,
  findTurnEntry,
  findTurnEntryForEvent,
  historyTurnCount,
  type AnyTurn,
  type ConversationLike,
} from "../turns/canonical-history";
import { upsertItem } from "../turns/steering-merge";
import {
  findItemInTurn,
  feedTerminalInput,
  OutputDeltaQueue,
  terminalBufferKey,
  TextDeltaQueue,
  appendWithTruncation,
  type FrameScheduler,
  type OutputDeltaEntry,
  type TextDeltaEntry,
} from "./delta-queues";

/** Rve 依赖的 ThreadStore 面。 */
export interface ItemNotificationThreadStore {
  /** 全量会话表（直读，判断会话存在/turn 数）。 */
  conversations: Map<string, ConversationLike>;
  updateConversationState(
    conversationId: string,
    updater: (draft: any) => void,
    options?: any,
  ): void;
  updateTurnState(
    conversationId: string,
    turnId: string | null,
    updater: (turn: AnyTurn) => void,
    options?: any,
  ): void;
}

/** Rve 构造参数。 */
export interface ItemNotificationHandlerParams {
  hostId: string;
  logger: any;
  threadStore: ItemNotificationThreadStore;
  now: () => number;
  scheduler: FrameScheduler & { schedule(callback: () => void, delayMs: number): () => void };
}

/** 输出 delta 的「[output truncated]」前缀标记。 */
const OUTPUT_TRUNCATED_PREFIX = `[output truncated]
`;

interface RealtimeTranscriptEntry {
  role: string;
  text: string;
}

interface RealtimeHandoffItem {
  type: 'handoff_request';
  handoff_id: string;
  item_id?: string;
  input_transcript: string;
  active_transcript: RealtimeTranscriptEntry[];
}

function isRealtimeHandoffItem(value: unknown): value is RealtimeHandoffItem {
  if (value == null || typeof value !== 'object') return false;
  let item = value as Record<string, unknown>;
  return (
    item.type === 'handoff_request' &&
    typeof item.handoff_id === 'string' &&
    (item.item_id == null || typeof item.item_id === 'string') &&
    typeof item.input_transcript === 'string' &&
    Array.isArray(item.active_transcript) &&
    item.active_transcript.every(
      (entry) =>
        entry != null &&
        typeof entry === 'object' &&
        typeof (entry as Record<string, unknown>).role === 'string' &&
        typeof (entry as Record<string, unknown>).text === 'string',
    )
  );
}

function unescapeRealtimeXml(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

function realtimeXmlField(value: string, field: string): string | null {
  let match = new RegExp(`<${field}>\\s*([\\s\\S]*?)\\s*<\\/${field}>`, 'i').exec(value)?.[1]?.trim();
  return match == null ? null : unescapeRealtimeXml(match);
}

/** realtime handoff_request 条目解析（原版 Cy）。 */
export function parseRealtimeItemAddedItem(value: unknown) {
  if (!isRealtimeHandoffItem(value)) return null;
  let raw = value.input_transcript.trim();
  let delegation =
    raw.startsWith('<realtime_delegation>') && raw.endsWith('</realtime_delegation>')
      ? {
          input: realtimeXmlField(raw, 'input'),
          transcriptDelta: realtimeXmlField(raw, 'transcript_delta'),
        }
      : null;
  let itemId = value.item_id ?? null;
  if (delegation?.input != null)
    return {
      codexItemId: `realtime-delegation-${itemId ?? value.handoff_id}`,
      handoffId: value.handoff_id,
      input: delegation.input,
      itemId,
      transcriptDelta: delegation.transcriptDelta,
    };
  let activeTranscript = value.active_transcript.map(({ role, text }) => `${role}: ${text}`).join('\n');
  let input = raw.length > 0 ? value.input_transcript : activeTranscript;
  if (input.trim().length === 0) return null;
  return {
    codexItemId: `realtime-delegation-${itemId ?? value.handoff_id}`,
    handoffId: value.handoff_id,
    input,
    itemId,
    transcriptDelta: raw.length > 0 && activeTranscript.length > 0 ? activeTranscript : null,
  };
}

function escapeRealtimeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** realtime 转写构造为普通 text input（原版 Wve）。 */
export function buildRealtimeTranscriptItems(input: string, transcriptDelta: string | null = null) {
  let inputLine = `  <input>${escapeRealtimeXml(input)}</input>`;
  let text =
    transcriptDelta == null || transcriptDelta.trim().length === 0
      ? `<realtime_delegation>\n${inputLine}\n</realtime_delegation>`
      : `<realtime_delegation>\n${inputLine}\n  <transcript_delta>${escapeRealtimeXml(transcriptDelta)}</transcript_delta>\n</realtime_delegation>`;
  return [{ type: 'text' as const, text, text_elements: [] }];
}

/** 原压缩导出名兼容。 */
export { parseRealtimeItemAddedItem as Cy, buildRealtimeTranscriptItems as Wve };

/**
 * 尾岛历史失效判定（原版 zve）：canonical 且全部 delta 都指向尾岛最后
 * 一个实体时，只失效该实体；否则返回 undefined（整体失效）。legacy 路径
 * 恒 { type: 'none' }。
 */
function tailHistoryInvalidation(
  conversation: ConversationLike,
  deltas: TextDeltaEntry[],
): { type: `entityKeys`; entityKeys: string[] } | { type: `none` } | undefined {
  if (conversation.turnHistory?.kind !== `canonical`) return { type: `none` };
  let history = (conversation.turnHistory as any).history;
  let tailKey = exhaustedTailIsland(history)?.entries.at(-1)?.value;
  if (tailKey == null) return;
  let tailTurn = history.entitiesByKey[tailKey];
  if (!(tailTurn == null || deltas.some((delta) => delta.turnId != null && delta.turnId !== tailTurn.turnId)))
    return { type: `entityKeys`, entityKeys: [tailKey] };
}

/**
 * item 通知分发器（原版 Rve）。纯定义区：实例由 R4 manager 装配。
 */
export class ItemNotificationHandler {
  private logger: any;
  private hostId: string;
  private threadStore: ItemNotificationThreadStore;
  private now: () => number;
  private outputDeltaQueue: OutputDeltaQueue | null = null;
  private frameTextDeltaQueue: TextDeltaQueue | null = null;
  private scheduler: ItemNotificationHandlerParams[`scheduler`];
  private terminalInputBuffers = new Map<string, string>();

  constructor({ hostId, logger, threadStore, now, scheduler }: ItemNotificationHandlerParams) {
    this.hostId = hostId;
    this.logger = logger;
    this.threadStore = threadStore;
    this.now = now;
    this.scheduler = scheduler;
  }

  /** 通知分发（原版 handleNotification 大 switch，delta 类入队）。 */
  handleNotification(notification: { method: string; params: any }): void {
    switch (notification.method) {
      case `item/agentMessage/delta`: {
        let { itemId, delta, threadId, turnId } = notification.params;
        this.getTextDeltaQueue().enqueue({
          conversationId: normalizeThreadId(threadId),
          turnId,
          itemId,
          target: { type: `agentMessage` },
          delta,
        });
        break;
      }
      case `item/plan/delta`: {
        let { itemId, delta, threadId, turnId } = notification.params;
        this.getTextDeltaQueue().enqueue({
          conversationId: normalizeThreadId(threadId),
          turnId,
          itemId,
          target: { type: `plan` },
          delta,
        });
        break;
      }
      case `item/reasoning/summaryTextDelta`: {
        let { itemId, delta, summaryIndex, threadId, turnId } = notification.params;
        this.getTextDeltaQueue().enqueue({
          conversationId: normalizeThreadId(threadId),
          turnId,
          itemId,
          target: { type: `reasoningSummary`, summaryIndex },
          delta,
        });
        break;
      }
      case `item/reasoning/summaryPartAdded`:
        this.logger.info(`Reasoning summary part added`, {
          safe: {},
          sensitive: { payload: notification.params },
        });
        break;
      case `item/reasoning/textDelta`: {
        let { itemId, delta, contentIndex, threadId, turnId } = notification.params;
        this.getTextDeltaQueue().enqueue({
          conversationId: normalizeThreadId(threadId),
          turnId,
          itemId,
          target: { type: `reasoningContent`, contentIndex },
          delta,
        });
        break;
      }
      case `item/commandExecution/outputDelta`: {
        let { itemId, delta, threadId, turnId } = notification.params;
        this.getOutputDeltaQueue().enqueue({
          conversationId: normalizeThreadId(threadId),
          turnId,
          itemId,
          delta,
        });
        break;
      }
      case `item/commandExecution/terminalInteraction`: {
        let { itemId, stdin, threadId, turnId } = notification.params;
        this.applyTerminalInteraction(normalizeThreadId(threadId), turnId, itemId, stdin);
        break;
      }
      case `item/fileChange/patchUpdated`: {
        let { changes, itemId, threadId, turnId } = notification.params;
        this.threadStore.updateTurnState(
          normalizeThreadId(threadId),
          turnId,
          (turn: AnyTurn) => {
            (turn as any).firstTurnWorkItemStartedAtMs =
              (turn as any).firstTurnWorkItemStartedAtMs ?? this.now();
            let existing = findItemInTurn(turn, itemId, `fileChange`, this.logger);
            if (existing) {
              existing.changes = freezeIdentity(changes);
              return;
            }
            upsertItem(
              turn,
              freezeIdentity({
                type: `fileChange`,
                id: itemId,
                changes,
                status: `inProgress`,
              }),
            );
          },
          {
            broadcastPatchesToFollowers: false,
            findTurnOptions: { rebindLatestInProgressPlaceholder: true },
          },
        );
        break;
      }
    }
  }

  /** 在回调前放空 delta 队列（原版 drainBefore）。 */
  drainBefore(callback: () => void): boolean {
    this.outputDeltaQueue?.flushNow();
    return this.frameTextDeltaQueue?.drainBefore(callback) ?? false;
  }

  /** 清单个 item 的终端输入缓冲。 */
  clearItemTerminalInputBuffer(conversationId: string, itemId: string): void {
    this.terminalInputBuffers.delete(terminalBufferKey(conversationId, itemId));
  }

  /** 清整 turn 的终端输入缓冲（双路径：legacy turns + canonical 实体）。 */
  clearTurnTerminalInputBuffers(conversationId: string, turnId: string): void {
    let conversation = this.threadStore.conversations.get(conversationId);
    if (conversation == null) return;
    let legacyTurn = conversation.turns.find((turn) => turn.turnId === turnId);
    if (legacyTurn != null)
      for (let item of legacyTurn.items)
        if (item.type === `commandExecution`)
          this.clearItemTerminalInputBuffer(conversationId, item.id);
    if (conversation.turnHistory?.kind !== `canonical`) return;
    let history = (conversation.turnHistory as any).history;
    let turn = history.entitiesByKey[`turn:${turnId}`];
    if (turn == null)
      // 无 turn: 前缀的本地实体：倒序扫岛找 turnId 匹配。
      for (let islandIndex = history.islands.length - 1; islandIndex >= 0; --islandIndex) {
        let island = history.islands[islandIndex];
        if (island != null) {
          for (let entryIndex = island.entries.length - 1; entryIndex >= 0; --entryIndex) {
            let key = island.entries[entryIndex]?.value;
            let entity = key == null ? void 0 : history.entitiesByKey[key];
            if (entity?.turnId === turnId) {
              turn = entity;
              break;
            }
          }
          if (turn != null) break;
        }
      }
    if (turn != null)
      for (let item of turn.items)
        if (item.type === `commandExecution`)
          this.clearItemTerminalInputBuffer(conversationId, item.id);
  }

  /** 清整会话的终端输入缓冲（key 前缀匹配）。 */
  clearConversationTerminalInputBuffers(conversationId: string): void {
    let prefix = terminalBufferKey(conversationId, ``);
    for (let key of this.terminalInputBuffers.keys())
      if (key.startsWith(prefix)) this.terminalInputBuffers.delete(key);
  }

  private getTextDeltaQueue(): TextDeltaQueue {
    this.frameTextDeltaQueue ??= new TextDeltaQueue({
      scheduler: this.scheduler,
      onFlush: (entries) => this.applyFrameTextDeltas(entries),
    });
    return this.frameTextDeltaQueue;
  }

  private getOutputDeltaQueue(): OutputDeltaQueue {
    this.outputDeltaQueue ??= new OutputDeltaQueue({
      schedule: (callback, delayMs) => this.scheduler.schedule(callback, delayMs),
      flushIntervalMs: 50,
      maxBufferedChars: 20_000,
      onFlush: (entries) => this.applyOutputDeltas(entries),
    });
    return this.outputDeltaQueue;
  }

  /** 应用一批输出 delta（原版 applyOutputDeltas）：按会话分组，超限截断
   *  并加 [output truncated] 前缀；text patch 以「删旧+插新」表达。 */
  private applyOutputDeltas(entries: OutputDeltaEntry[]): void {
    if (entries.length === 0) return;
    let entriesByConversation = new Map<string, OutputDeltaEntry[]>();
    for (let entry of entries) {
      let grouped = entriesByConversation.get(entry.conversationId);
      if (grouped) grouped.push(entry);
      else entriesByConversation.set(entry.conversationId, [entry]);
    }
    for (let [conversationId, conversationEntries] of entriesByConversation) {
      let conversation = this.threadStore.conversations.get(conversationId);
      if (!conversation || historyTurnCount(conversation) === 0) continue;
      let acceptedTranscriptText: any = { changes: [], turnEntityKeys: new Set() };
      this.threadStore.updateConversationState(
        conversationId,
        (draft: ConversationLike) => {
          for (let { turnId, itemId, delta } of conversationEntries) {
            let turnEntry = findTurnEntry(draft, (turn) =>
              turn.items.some((item) => item.id === itemId && item.type === `commandExecution`),
            );
            let item =
              turnEntry == null
                ? null
                : findItemInTurn(turnEntry.turn, itemId, `commandExecution`, this.logger);
            if (item != null && turnEntry != null) {
              let previousOutput = item.aggregatedOutput ?? ``;
              let hadTruncationPrefix = previousOutput.startsWith(OUTPUT_TRUNCATED_PREFIX);
              let untruncated = hadTruncationPrefix
                ? previousOutput.slice(OUTPUT_TRUNCATED_PREFIX.length)
                : previousOutput;
              let { next, didTruncate, retainedLength, appended } = appendWithTruncation({
                current: untruncated,
                delta,
              });
              let shouldAddPrefix = didTruncate || untruncated !== previousOutput;
              item.aggregatedOutput = shouldAddPrefix ? OUTPUT_TRUNCATED_PREFIX + next : next;
              let insertedPrefix = shouldAddPrefix ? OUTPUT_TRUNCATED_PREFIX : ``;
              acceptedTranscriptText.turnEntityKeys.add(turnEntry.entityKey);
              acceptedTranscriptText.changes.push({
                type: `text`,
                key: {
                  hostId: this.hostId,
                  threadId: conversationId,
                  entityKey: turnEntry.entityKey,
                  itemId,
                },
                target: { field: `aggregatedOutput` },
                edits: [
                  { at: 0, deleteCount: previousOutput.length - retainedLength, insert: insertedPrefix },
                  { at: insertedPrefix.length + retainedLength, deleteCount: 0, insert: appended },
                ],
              });
              continue;
            }
            if (item == null)
              this.logger.debug(`Dropping commandExecution/outputDelta for missing item`, {
                safe: { itemId, conversationId, turnId },
                sensitive: {},
              });
          }
        },
        { broadcastPatchesToFollowers: false, acceptedTranscriptText },
      );
    }
  }

  /** 应用终端交互（原版 applyTerminalInteraction）：stdin 控制字符解析，
   *  完整命令计入 commandActions。 */
  private applyTerminalInteraction(
    conversationId: string,
    turnId: string | null,
    itemId: string,
    stdin: string,
  ): void {
    let key = terminalBufferKey(conversationId, itemId);
    let { commands, inputBuffer } = feedTerminalInput(this.terminalInputBuffers.get(key) ?? ``, stdin);
    if (inputBuffer.length > 0) this.terminalInputBuffers.set(key, inputBuffer);
    else this.terminalInputBuffers.delete(key);
    if (commands.length !== 0)
      this.threadStore.updateConversationState(
        conversationId,
        (draft: ConversationLike) => {
          let turnEntry = findDraftTurn(draft, (turn) =>
            turn.items.some((item) => item.id === itemId && item.type === `commandExecution`),
          );
          let item =
            turnEntry == null
              ? null
              : findItemInTurn(turnEntry, itemId, `commandExecution`, this.logger);
          if (item != null) {
            for (let command of commands)
              item.commandActions.push({ type: `unknown`, command });
            return;
          }
          this.logger.debug(`Dropping commandExecution/terminalInteraction for missing item`, {
            safe: { itemId, conversationId, turnId },
            sensitive: {},
          });
        },
        { broadcastPatchesToFollowers: false },
      );
  }

  /** 应用一批帧分文本 delta（原版 applyFrameTextDeltas）：按会话分组，
   *  四类目标分别写入 text/summary[i]/content[i]，产生 acceptedTranscriptText
   *  变更记录与 knownChangedItems/knownHistoryInvalidation。 */
  private applyFrameTextDeltas(entries: TextDeltaEntry[]): void {
    if (entries.length === 0) return;
    let entriesByConversation = new Map<string, TextDeltaEntry[]>();
    for (let entry of entries) {
      let grouped = entriesByConversation.get(entry.conversationId);
      if (grouped) grouped.push(entry);
      else entriesByConversation.set(entry.conversationId, [entry]);
    }
    for (let [conversationId, conversationEntries] of entriesByConversation) {
      let conversation = this.threadStore.conversations.get(conversationId);
      if (!conversation || historyTurnCount(conversation) === 0) continue;
      let knownHistoryInvalidation = tailHistoryInvalidation(conversation, conversationEntries);
      let knownChangedItems: { entityKey: string; itemId: string }[] = [];
      let acceptedTranscriptText: any = { changes: [], turnEntityKeys: new Set() };
      this.threadStore.updateConversationState(
        conversationId,
        (draft: ConversationLike) => {
          for (let entry of conversationEntries) {
            let turnEntry = findTurnEntryForEvent(draft, entry.turnId, { logger: this.logger });
            if (!turnEntry) continue;
            let turn = turnEntry.turn;
            let key = {
              hostId: this.hostId,
              threadId: conversationId,
              entityKey: turnEntry.entityKey,
              itemId: entry.itemId,
            };
            knownChangedItems.push({ entityKey: key.entityKey, itemId: key.itemId });
            acceptedTranscriptText.turnEntityKeys.add(turnEntry.entityKey);
            switch (entry.target.type) {
              case `agentMessage`: {
                let item = findItemInTurn(turn, entry.itemId, `agentMessage`, this.logger);
                if (item) {
                  acceptedTranscriptText.changes.push({
                    type: `text`,
                    key,
                    target: { field: `text` },
                    edits: [{ at: (item.text ?? ``).length, deleteCount: 0, insert: entry.delta }],
                  });
                  item.text = (item.text ?? ``) + entry.delta;
                }
                break;
              }
              case `plan`: {
                let item = findItemInTurn(turn, entry.itemId, `plan`, this.logger);
                if (item) {
                  acceptedTranscriptText.changes.push({
                    type: `text`,
                    key,
                    target: { field: `text` },
                    edits: [{ at: (item.text ?? ``).length, deleteCount: 0, insert: entry.delta }],
                  });
                  item.text = (item.text ?? ``) + entry.delta;
                }
                break;
              }
              case `reasoningSummary`: {
                let item = findItemInTurn(turn, entry.itemId, `reasoning`, this.logger);
                if (!item) break;
                let summaryIndex = entry.target.summaryIndex;
                if (!Number.isSafeInteger(summaryIndex) || summaryIndex < 0) {
                  this.logger.warning(`Invalid reasoning summary index`, {
                    safe: { summaryIndex: String(summaryIndex) },
                    sensitive: {},
                  });
                  break;
                }
                let previousLength = item.summary.length;
                for (; item.summary.length <= summaryIndex; ) item.summary.push(``);
                if (item.summary.length > previousLength) {
                  acceptedTranscriptText.changes.push({
                    type: `text-parts`,
                    key,
                    field: `summary`,
                    at: previousLength,
                    values: item.summary.slice(previousLength),
                  });
                  acceptedTranscriptText.changes.push({
                    type: `text`,
                    key,
                    target: { field: `summary`, index: summaryIndex },
                    edits: [
                      { at: item.summary[summaryIndex].length, deleteCount: 0, insert: entry.delta },
                    ],
                  });
                  item.summary[summaryIndex] += entry.delta;
                }
                break;
              }
              case `reasoningContent`: {
                let item = findItemInTurn(turn, entry.itemId, `reasoning`, this.logger);
                if (!item) break;
                let contentIndex = entry.target.contentIndex;
                if (!Number.isSafeInteger(contentIndex) || contentIndex < 0) {
                  this.logger.warning(`Invalid reasoning content index`, {
                    safe: { contentIndex: String(contentIndex) },
                    sensitive: {},
                  });
                  break;
                }
                let previousLength = item.content.length;
                for (; item.content.length <= contentIndex; ) item.content.push(``);
                if (item.content.length > previousLength) {
                  acceptedTranscriptText.changes.push({
                    type: `text-parts`,
                    key,
                    field: `content`,
                    at: previousLength,
                    values: item.content.slice(previousLength),
                  });
                  acceptedTranscriptText.changes.push({
                    type: `text`,
                    key,
                    target: { field: `content`, index: contentIndex },
                    edits: [
                      { at: item.content[contentIndex].length, deleteCount: 0, insert: entry.delta },
                    ],
                  });
                  item.content[contentIndex] += entry.delta;
                }
                break;
              }
            }
          }
        },
        { knownHistoryInvalidation, knownChangedItems, acceptedTranscriptText },
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 兼容导出（原版压缩名；R4 切换语义名后移除）
// ---------------------------------------------------------------------------

export { ItemNotificationHandler as Rve };
