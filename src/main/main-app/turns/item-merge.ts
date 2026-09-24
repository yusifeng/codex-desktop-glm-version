// turn/item 通用合并引擎。
//
// 原版 main-C-Mhak1n.ts 30,188-30,427。canonical 与 legacy 双路径共用的
// 合并核心：
//   - bg（mergeItems）：item 列表合并——按 id 配对（preferIncoming 或
//     snapshot 模式下取 incoming；final_answer 的 memoryCitation 特例保留
//     existing）、无 id 的 final_answer 按 text 去重、未配对的 incoming 按
//     配对锚点插入或首尾拼接（snapshot 模式按 snapshotBeforeItemId 定位）；
//   - Cg（mergeTurnLists）：turn 列表合并——existing 逐个与 incoming 按
//     turnId 配对（未配对且为自动化空 turn 时丢弃），incoming 中 turnId
//     未出现在 existing 的为「新增段」，按其后的已知 turnId 锚点插到
//     existing 之间；结果含跨 turn steering 时做孤儿回收；
//   - xge（mergeTurn）：单 turn 合并（items/pagination/params/状态与各类
//     时间戳的取舍规则），resume 快照与重连（reconnect）语义在此。
//   - wg/Sge：automation 消息定位与「纯自动化 turn」判定（压缩丢弃用）。

import { dd as parseAutomationToolOutput } from "@chunk/shared";
import { freezeIdentity, produce } from "../vendor/immer";
import { deepEqual } from "../util/lodash-interop";
import {
  isUnboundSteeringMessage,
  recoverSteeringOrphans,
  recoverTurnSteeringOrphans,
  type AnyTurn,
} from "./steering-merge";

export type { AnyTurn };

/** turn 合并策略（automation 判定器 Y_ / Cve 聚合实现该接口）。 */
export interface TurnMergePolicy {
  isAutomationUserInput(input: unknown): boolean;
  isAutomationAssistantMessage(text: unknown): boolean;
}

/** item 合并模式：`append`/`prepend` 或 snapshot 定位（{snapshotBeforeItemId}）。 */
export type ItemMergeMode = 'append' | 'prepend' | { snapshotBeforeItemId: string | null };

/** agentMessage item 谓词（原版 Tg）。 */
export function isAgentMessage(item: any): boolean {
  return item?.type === `agentMessage`;
}

/** userMessage / functionCallOutput（用户侧输入形态，原版 wge）。 */
export function isUserInputLike(item: any): boolean {
  return item?.type === `userMessage` || item?.type === `functionCallOutput`;
}

/** 空 turn 占位（无 id/时间、completed、无 item，原版 xg）。 */
export function isPlaceholderTurn(turn: AnyTurn): boolean {
  return (
    turn.turnId == null &&
    turn.turnStartedAtMs == null &&
    turn.status === `completed` &&
    turn.error == null &&
    turn.items.length === 0
  );
}

/** final_answer 阶段、带 text 与 memoryCitation 字段的 agentMessage（原版 Sg）。 */
function isFinalAnswerAgentMessage(item: any): boolean {
  return (
    item.type === `agentMessage` &&
    `phase` in item &&
    item.phase === `final_answer` &&
    `text` in item &&
    typeof item.text == `string` &&
    `memoryCitation` in item &&
    typeof item.memoryCitation == `object`
  );
}

/**
 * item 列表合并（原版 bg）。见文件头；返回新数组（不修改入参）。
 *
 * @param existing 现有 items
 * @param incoming 新到 items
 * @param mode `append`（默认，未配对 incoming 拼到尾部）/ `prepend`（全部
 *   未配对时拼到头部）/ `{snapshotBeforeItemId}`（snapshot 重建：插入点在
 *   该 item 之前；id 相同一律取 incoming，无 id 的非 final_answer 丢弃）
 * @param options.preferIncomingItems id 配对时一律取 incoming（保留 existing
 *   的 memoryCitation）
 */
export function mergeItems(
  existing: any[],
  incoming: any[],
  mode: ItemMergeMode = `append`,
  { preferIncomingItems = false }: { preferIncomingItems?: boolean } = {},
): any[] {
  let isSnapshotMode = typeof mode == `object`;
  let existingById = new Map(existing.map((item) => [item.id, item]));
  let incomingIdToExistingId = new Map();
  let replacementsByExistingId = new Map();
  for (let item of incoming) {
    let matched = existingById.get(item.id);
    if (matched != null) {
      incomingIdToExistingId.set(item.id, matched.id);
      if (
        preferIncomingItems &&
        isFinalAnswerAgentMessage(item) &&
        isFinalAnswerAgentMessage(matched) &&
        item.memoryCitation == null &&
        matched.memoryCitation != null
      ) {
        // incoming 丢失了 memoryCitation：保留 existing 的。
        replacementsByExistingId.set(matched.id, { ...item, memoryCitation: matched.memoryCitation });
      } else
        replacementsByExistingId.set(
          matched.id,
          preferIncomingItems || (isSnapshotMode && item.type === `agentMessage`) ? item : matched,
        );
      continue;
    }
    // snapshot 模式或非 final_answer 的无 id incoming：丢弃。
    if (isSnapshotMode || !isFinalAnswerAgentMessage(item)) continue;
    // 无 id 的 final_answer：按未替换的相同文本 existing 去重配对。
    let textMatch = existing.find(
      (candidate) =>
        !replacementsByExistingId.has(candidate.id) &&
        isFinalAnswerAgentMessage(candidate) &&
        candidate.text === item.text,
    );
    if (textMatch == null) continue;
    incomingIdToExistingId.set(item.id, textMatch.id);
    replacementsByExistingId.set(textMatch.id, {
      ...textMatch,
      ...item,
      id: preferIncomingItems ? item.id : textMatch.id,
      memoryCitation: item.memoryCitation ?? textMatch.memoryCitation,
    });
  }
  let merged = existing.map((item) => replacementsByExistingId.get(item.id) ?? item);
  let unmatchedIncoming: any[] = [];
  for (let item of incoming) {
    let matchedExistingId = incomingIdToExistingId.get(item.id);
    if (matchedExistingId == null) {
      unmatchedIncoming.push(item);
      continue;
    }
    if (unmatchedIncoming.length === 0) continue;
    // 把未配对 incoming 插到其后的第一个配对 existing 之前（保持流式顺序）。
    let insertIndex = merged.findIndex(
      (candidate) =>
        candidate.id === (replacementsByExistingId.get(matchedExistingId)?.id ?? matchedExistingId),
    );
    if (insertIndex !== -1) {
      merged = merged.slice(0, insertIndex).concat(unmatchedIncoming, merged.slice(insertIndex));
      unmatchedIncoming = [];
    }
  }
  if (unmatchedIncoming.length === 0) return merged;
  if (typeof mode == `object` && mode.snapshotBeforeItemId != null) {
    let snapshotIndex = merged.findIndex((item) => item.id === mode.snapshotBeforeItemId);
    if (snapshotIndex !== -1)
      return merged.slice(0, snapshotIndex).concat(unmatchedIncoming, merged.slice(snapshotIndex));
  }
  return incomingIdToExistingId.size === 0 && mode === `prepend`
    ? unmatchedIncoming.concat(merged)
    : merged.concat(unmatchedIncoming);
}

/** turn 列表合并选项（Cg/xge 共用）。 */
export interface TurnMergeOptions {
  isResumeSnapshot?: boolean;
  itemMergeMode?: ItemMergeMode;
  preserveExistingTerminalState?: boolean;
  preferIncomingItems?: boolean;
  policy?: TurnMergePolicy | null;
}

/**
 * turn 列表合并（原版 Cg）：existing 与 incoming 按 turnId 配对合并；
 * incoming 中 turnId 未出现在 existing 的为「新增段」，插入到其后第一个
 * 已知 turnId 之前（无锚点则拼尾）。existing 中无 turnId 的本地 turn 保留
 * 原位。结果含跨 turn steering 时先做孤儿回收并滤掉空占位 turn。
 */
export function mergeTurnLists(
  existing: AnyTurn[],
  incoming: AnyTurn[],
  options: TurnMergeOptions = {},
): AnyTurn[] {
  let existingTurnIds = new Set(existing.flatMap((turn) => (turn.turnId == null ? [] : [turn.turnId])));
  let incomingByTurnId = new Map(incoming.flatMap((turn) => (turn.turnId == null ? [] : [[turn.turnId, turn]])));
  let mergedExisting = existing.flatMap((turn) => {
    if (isPlaceholderTurn(turn)) return [];
    if (turn.turnId == null) return [turn];
    let matched = incomingByTurnId.get(turn.turnId);
    // 无配对且是纯自动化 turn（压缩后无痕丢弃）：丢弃；否则保留。
    return matched == null
      ? isAutomationOnlyTurn(turn, options.policy) && !turn.items.some(isUnboundSteeringMessage)
        ? []
        : [turn]
      : [mergeTurn(turn, matched, options)];
  });
  // incoming 中未与 existing 配对的 turn，按「其后第一个已知 turnId」分桶。
  let insertedBeforeTurnId = new Map<string, AnyTurn[]>();
  let trailingNewTurns: AnyTurn[] = [];
  for (let turn of incoming) {
    if (turn.turnId != null && existingTurnIds.has(turn.turnId)) {
      if (trailingNewTurns.length === 0) continue;
      let bucket = insertedBeforeTurnId.get(turn.turnId);
      if (bucket == null) insertedBeforeTurnId.set(turn.turnId, trailingNewTurns);
      else bucket.push(...trailingNewTurns);
      trailingNewTurns = [];
      continue;
    }
    trailingNewTurns.push(turn);
  }
  let result: AnyTurn[] = [];
  for (let turn of mergedExisting) {
    let bucket = turn.turnId == null ? void 0 : insertedBeforeTurnId.get(turn.turnId);
    if (bucket != null && turn.turnId != null) {
      for (let inserted of bucket) result.push(inserted);
      insertedBeforeTurnId.delete(turn.turnId);
    }
    result.push(turn);
  }
  for (let turn of trailingNewTurns) result.push(turn);
  return result.some((turn) =>
    turn.items.some((item: any) => item.type === `steeringUserMessage` && item.targetTurnId !== turn.turnId),
  )
    ? produce(result, recoverSteeringOrphans).filter((turn) => !isPlaceholderTurn(turn))
    : result;
}

/**
 * 单 turn 合并（原版 xge）。existing 为本地（含用户本地状态），incoming 为
 * app-server 快照/事件。要点：
 *   - 状态：existing 终态 + incoming inProgress → 保留 existing 终态
 *     （preserveExistingTerminalState 或有 pagination 时）；
 *   - itemsPagination：timeline 来源特殊处理（hasLoadedOldest 合取）；
 *     resume 快照时处理重连游标（reconnect）；与 existing 完全相同则复用；
 *   - items：preferIncoming / snapshot / 终态保留 / steering 回填 / 尾部
 *     final_answer 重复合并 五种路径；
 *   - params/时间戳等：existing 优先（?? 链）。
 */
export function mergeTurn(
  existing: AnyTurn,
  incoming: AnyTurn,
  {
    isResumeSnapshot = false,
    itemMergeMode = `append`,
    preserveExistingTerminalState = false,
    preferIncomingItems = false,
    policy,
  }: TurnMergeOptions = {},
): AnyTurn {
  let existingIsTerminalAndIncomingInProgress =
    existing.status !== `inProgress` && incoming.status === `inProgress`;
  let itemsPagination =
    existing.itemsPagination == null
      ? incoming.itemsPagination
      : { ...incoming.itemsPagination, ...existing.itemsPagination };
  let incomingPaginationIsTimeline = incoming.itemsPagination?.source === `timeline`;
  if (incoming.itemsPagination?.source === `timeline`)
    itemsPagination = {
      ...existing.itemsPagination,
      ...incoming.itemsPagination,
      hasLoadedOldest:
        incoming.itemsPagination.hasLoadedOldest ||
        (!isResumeSnapshot && existing.itemsPagination?.hasLoadedOldest === true),
      reconnect: void 0,
    };
  if (isResumeSnapshot && !incomingPaginationIsTimeline && incoming.itemsPagination != null) {
    // resume 快照：以本地 reconnect 锚点恢复分页状态——incoming 含 stop
    // 项则从其 olderCursorAfterReconnect 继续，否则建立 reconnect 记录。
    let localPagination = existing.itemsPagination;
    let stopItemId =
      localPagination?.reconnect == null ? localPagination?.newestSnapshotItemId : localPagination.reconnect.stopItemId;
    let cursorAfterReconnect =
      localPagination?.reconnect == null ? localPagination?.olderCursor : localPagination.reconnect.olderCursorAfterReconnect;
    let reconnectResolved =
      incoming.itemsPagination.summaryItemIds == null &&
      stopItemId != null &&
      incoming.items.some((item: any) => item.id === stopItemId);
    let olderCursor = reconnectResolved ? (cursorAfterReconnect ?? null) : incoming.itemsPagination.olderCursor;
    let hasLoadedOldest =
      incoming.itemsPagination.hasLoadedOldest || (reconnectResolved && cursorAfterReconnect == null);
    itemsPagination = {
      ...incoming.itemsPagination,
      olderCursor: hasLoadedOldest ? null : olderCursor,
      hasLoadedOldest,
      reconnect:
        hasLoadedOldest || reconnectResolved
          ? void 0
          : {
              beforeItemId: incoming.items[0]?.id ?? null,
              stopItemId,
              olderCursorAfterReconnect: cursorAfterReconnect ?? void 0,
            },
    };
  }
  if (deepEqual(itemsPagination, existing.itemsPagination)) itemsPagination = existing.itemsPagination;
  let items = incoming.items;
  if (preferIncomingItems)
    items = mergeItems(existing.items, incoming.items, itemMergeMode, { preferIncomingItems: true });
  else if (existing.itemsPagination != null || incoming.itemsPagination != null)
    items = mergeItems(existing.items, incoming.items, isResumeSnapshot ? { snapshotBeforeItemId: null } : itemMergeMode);
  else if (preserveExistingTerminalState && existingIsTerminalAndIncomingInProgress) items = existing.items;
  else if (existing.items.some((item: any) => item.type === `steeringUserMessage`)) {
    // steering 场景：先按 id 回填 incoming 的 agentMessage，再做普通合并。
    let incomingById = new Map(items.map((item: any) => [item.id, item]));
    items = mergeItems(
      existing.items.map((item: any) => (isAgentMessage(item) ? (incomingById.get(item.id) ?? item) : item)),
      items,
    );
  } else if (existing.items.length > incoming.items.length) {
    // 本地 items 更多（流式中途的快照回放）：保留本地，但补回 incoming 尾部
    // 缺失的 final_answer（id 或 text 匹配；id 不同则合并为一条）。
    items = existing.items;
    for (let index = incoming.items.length - 1; index >= 0; --index) {
      let incomingItem = incoming.items[index];
      if (!isAgentMessage(incomingItem) || incomingItem.phase !== `final_answer`) continue;
      let localMatch = existing.items.find(
        (item: any) =>
          item != null &&
          isAgentMessage(item) &&
          (item.id === incomingItem.id || (item.phase === `final_answer` && item.text === incomingItem.text)),
      );
      if (localMatch == null) items = [...existing.items, incomingItem];
      else if (localMatch.id !== incomingItem.id) {
        let combined = {
          ...localMatch,
          ...incomingItem,
          id: localMatch.id,
          memoryCitation: incomingItem.memoryCitation ?? localMatch.memoryCitation,
        };
        items = existing.items.map((item: any) => (item === localMatch ? combined : item));
      }
      break;
    }
  }
  let automationItem = findAutomationItem(incoming.items, policy) ?? findAutomationItem(existing.items, policy);
  let orderedItems =
    automationItem == null || findAutomationItem(items, policy) != null
      ? items
      : [automationItem, ...items];
  let automationKind = (existing as any).automationKind ?? (incoming as any).automationKind;
  let merged = {
    ...incoming,
    ...(automationKind == null ? {} : { automationKind }),
    localMetadata: (existing as any).localMetadata ?? (incoming as any).localMetadata,
    requestTraceId: (existing as any).requestTraceId ?? (incoming as any).requestTraceId,
    requestedReasoningEffort: (existing as any).requestedReasoningEffort ?? (incoming as any).requestedReasoningEffort,
    status:
      existingIsTerminalAndIncomingInProgress && (preserveExistingTerminalState || itemsPagination != null)
        ? existing.status
        : incoming.status,
    error: preserveExistingTerminalState && existingIsTerminalAndIncomingInProgress ? existing.error : incoming.error,
    params: mergeTurnParams(existing, incoming, policy),
    items: orderedItems,
    ...(itemsPagination == null ? {} : { itemsPagination }),
    hookRuns: (existing as any).hookRuns != null && (existing as any).hookRuns.length > 0 ? (existing as any).hookRuns : (incoming as any).hookRuns,
    diff: (incoming as any).diff ?? (existing as any).diff,
    interruptedCommandExecutionItemIds:
      (incoming as any).interruptedCommandExecutionItemIds ?? (existing as any).interruptedCommandExecutionItemIds,
    aeonAssistantMessageStartedAtMsById:
      (existing as any).aeonAssistantMessageStartedAtMsById ?? (incoming as any).aeonAssistantMessageStartedAtMsById,
    commandExecutionStartedAtMsById:
      (existing as any).commandExecutionStartedAtMsById ?? (incoming as any).commandExecutionStartedAtMsById,
    turnStartedAtMs: existing.turnStartedAtMs ?? incoming.turnStartedAtMs,
    durationMs: (existing as any).durationMs ?? (incoming as any).durationMs,
    finalAssistantStartedAtMs: (existing as any).finalAssistantStartedAtMs ?? (incoming as any).finalAssistantStartedAtMs,
  };
  return existing.items.some((item: any) => item.type === `steeringUserMessage`)
    ? produce(merged, recoverTurnSteeringOrphans)
    : merged;
}

/** 找 turn items 里的 automation 消息（原版 wg：userMessage 按 policy 判定，
 *  functionCallOutput 按 toolOutput 的 automation 解析）。 */
export function findAutomationItem(items: any[], policy: TurnMergePolicy | null | undefined): any | null {
  if (policy == null) return null;
  for (let item of items)
    if (
      isUserInputLike(item) &&
      (item.type === `userMessage` ? policy.isAutomationUserInput(item.content) : parseAutomationToolOutput(item) != null)
    )
      return item;
  return null;
}

/** 是否纯自动化 turn（原版 Sge）：completed、无错误、输入与输出都是自动化
 *  生成（压缩时可无痕丢弃）。 */
export function isAutomationOnlyTurn(
  turn: AnyTurn,
  policy: TurnMergePolicy | null | undefined,
): boolean {
  return policy == null ||
    turn.status !== `completed` ||
    turn.error != null ||
    policy.isAutomationUserInput(turn.params.input) ||
    parseAutomationToolOutput(turn.params.toolOutput) != null ||
    findAutomationItem(turn.items, policy) != null
    ? false
    : turn.items.some((item: any) => isAgentMessage(item) && policy.isAutomationAssistantMessage(item.text));
}

/** 合并 turn params（原版 Cge）：existing 带本地输入而 incoming 为空时保留
 *  existing；automation 输入/输出取 incoming；否则 incoming 为主但保留
 *  existing 的本地输入。 */
export function mergeTurnParams(
  existing: AnyTurn,
  incoming: AnyTurn,
  policy: TurnMergePolicy | null | undefined,
): any {
  return existing.params.clientUserMessageId != null &&
    existing.params.input.length > 0 &&
    incoming.params.input.length === 0
    ? existing.params
    : policy == null ||
        policy.isAutomationUserInput(incoming.params.input) ||
        parseAutomationToolOutput(incoming.params.toolOutput) != null ||
        (!policy.isAutomationUserInput(existing.params.input) &&
          parseAutomationToolOutput(existing.params.toolOutput) == null)
      ? incoming.params
      : { ...incoming.params, input: existing.params.input, toolOutput: existing.params.toolOutput };
}
