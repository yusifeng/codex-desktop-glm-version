// canonical turnHistory（islands/entitiesByKey）模型：访问器 + 拓扑操作。
//
// 原版 main-C-Mhak1n.ts 30,428-30,532（访问器）、30,533-30,569（列表 →
// history 构造）、30,687-30,875（island 拓扑）、30,876-31,000（边界页恢复）、
// 31,013-31,118（gap 视图 + history 构建）、31,119-31,238（应用与 turn 定位）。
//
// 模型：conversation.turnHistory = { kind: 'canonical', history } 或 legacy
// conversation.turns 数组——**双路径并存**，每个访问器都有两套分支：
//   - history.islands：按边界（older/newer boundary）切分的 turn 实体岛，
//     entries 按 key 引用 entitiesByKey 中的实体（turn 对象）；
//   - 边界 status：'available'（还有一页可取，handle 含 source/cursor）或
//     'exhausted'（到头）；
//   - generation：每次整体重建（m_）自增，使旧的边界句柄失效。
//
// 拓扑操作（Fge/Ige/Wg…）是纯函数：以 merge 适配器（getIdentity/
// getPosition/merge）操作岛列表，保证去重、排序、边界唯一性（Qg 断言）。

import { freezeIdentity } from "../vendor/immer";
import { findLast } from "../util/lodash-interop";
import { mergeTurnLists, type AnyTurn } from "./item-merge";

export type { AnyTurn };

/** 历史边界（岛的一侧）。 */
export interface HistoryBoundary {
  status: 'available' | 'exhausted';
  boundaryId?: string;
  handle?: { source: string; cursor: string | null; oldestLoadedTurnId: string | null };
  progressKey?: string;
}

/**
 * 历史岛的 entry。canonical history（f_/Ige/Gg 构建维护）里是
 * `{key, value}`（value = entitiesByKey 的键）；kge/Age 构造的临时完整
 * 视图里是 `{key, turn}`（turn 直接持有实体）——两种形态并存于原版。
 */
export interface HistoryEntry {
  key: string;
  value?: string;
  turn?: AnyTurn;
}

/** 历史岛：一组连续的 turn 实体引用。 */
export interface HistoryIsland {
  id: string;
  entries: HistoryEntry[];
  olderBoundary: HistoryBoundary;
  newerBoundary: HistoryBoundary;
}

/** canonical 历史拓扑。 */
export interface CanonicalHistory {
  generation: number;
  isComplete: boolean;
  islands: HistoryIsland[];
  entitiesByKey: Record<string, AnyTurn>;
}

/** 边界句柄：恢复一页历史所需的完整定位（含 generation 校验）。 */
export interface BoundaryHandle {
  edge: 'older' | 'newer';
  generation: number;
  islandId: string;
  boundaryId: string;
  progressKey: string;
  handle: { source: string; cursor: string | null; oldestLoadedTurnId: string | null };
}

/** conversation（canonical 或 legacy 双路径的宽松视图）。 */
export interface ConversationLike {
  id: string;
  turns: AnyTurn[];
  turnHistory?: { kind: `canonical`; history: CanonicalHistory } | { kind?: string };
  turnsPagination?: any;
  resumeState?: string;
  [key: string]: unknown;
}

/** 取 canonical history（无则 null，原版 S_）。 */
export function canonicalHistory(conversation: ConversationLike): CanonicalHistory | null {
  return conversation.turnHistory?.kind === `canonical` ? (conversation.turnHistory as any).history : null;
}

// ---------------------------------------------------------------------------
// 访问器（原版 Eg..zg）
// ---------------------------------------------------------------------------

/** 已到头的尾岛（newer 边界 exhausted，原版 Eg）。 */
export function exhaustedTailIsland(history: CanonicalHistory): HistoryIsland | null {
  let island = history.islands.at(-1);
  return island?.newerBoundary.status === `exhausted` ? island : null;
}

/** 全部岛的 entry 平铺（单岛直取，原版 Tge）。 */
function flattenIslandEntries(history: CanonicalHistory): HistoryEntry[] {
  return history.islands.length === 1
    ? (history.islands[0]?.entries ?? [])
    : history.islands.flatMap((island) => island.entries);
}

/** 全部 entry 携带的 turn（kge/Age 临时视图的实体提取，原版 Ege）。 */
export function historyIslandTurns(history: CanonicalHistory): AnyTurn[] {
  return flattenIslandEntries(history).map((entry) => entry.turn) as AnyTurn[];
}

/** 完整（isComplete 且单岛）history 的 turn 列表，否则 null（原版 Dge）。 */
export function completeHistoryTurns(history: CanonicalHistory): AnyTurn[] | null {
  return !history.isComplete || history.islands.length !== 1 ? null : historyIslandTurns(history);
}

/** 全部实体（按岛序，原版 Dg）。 */
export function allHistoryEntities(history: CanonicalHistory): AnyTurn[] {
  return history.islands.flatMap((island) =>
    island.entries.map((entry) => history.entitiesByKey[entry.value]),
  );
}

/** conversation 的 turn 视图（canonical → 实体；legacy → turns，原版 Og）。 */
export function conversationTurns(conversation: ConversationLike): AnyTurn[] {
  return conversation.turnHistory?.kind === `canonical`
    ? allHistoryEntities((conversation.turnHistory as any).history)
    : conversation.turns;
}

/** 合并本地占位 turn 后的视图（canonical 时与 legacy turns 合并，原版 kg）。 */
export function mergedConversationTurns(
  conversation: ConversationLike,
  policy: any,
): AnyTurn[] {
  let turns = conversationTurns(conversation);
  return conversation.turnHistory?.kind === `canonical`
    ? mergeTurnLists(turns, conversation.turns, { policy })
    : turns;
}

/** 按 turnId 查 turn（合并视图，原版 Ag）。 */
export function findTurnById(
  conversation: ConversationLike | null,
  turnId: string,
  policy?: any,
): AnyTurn | null {
  return conversation == null
    ? null
    : (mergedConversationTurns(conversation, policy).find((turn) => turn.turnId === turnId) ?? null);
}

/** turn 的最后一条 agentMessage 文本（原版 Oge）。 */
export function findTurnAgentMessageText(
  conversation: ConversationLike | null,
  turnId: string,
  policy?: any,
): string | null {
  let turn = findTurnById(conversation, turnId, policy);
  return findLast(turn?.items, (item: any) => item.type === `agentMessage`)?.text ?? null;
}

/** turn 总数（原版 jg）。 */
export function historyTurnCount(conversation: ConversationLike): number {
  return conversation.turnHistory?.kind === `canonical`
    ? (conversation.turnHistory as any).history.islands.reduce(
        (count: number, island: HistoryIsland) => count + island.entries.length,
        0,
      )
    : conversation.turns.length;
}

/** 完整历史下的全部实体（原版 Mg）：canonical 要求 isComplete + 单岛；
 *  legacy 要求 resumed + hasLoadedOldest；分页未加载全返回 null。 */
export function completeHistoryEntities(conversation: ConversationLike | null): AnyTurn[] | null {
  if (conversation == null || !allTurnsLoadedOldest(conversation)) return null;
  if (conversation.turnHistory?.kind === `canonical`) {
    let { history } = conversation.turnHistory as any;
    if (history.isComplete && history.islands.length === 1) return allHistoryEntities(history);
  }
  return legacyHistoryComplete(conversation) ? conversation.turns : null;
}

/** 最后一个 turn（canonical 走尾岛，原版 Ng）。 */
export function lastTurn(conversation: ConversationLike): AnyTurn | null {
  if (conversation.turnHistory?.kind === `canonical`) {
    let { history } = conversation.turnHistory as any;
    let island = exhaustedTailIsland(history);
    if (island != null) {
      let lastKey = island.entries.at(-1)?.value;
      return lastKey == null ? null : (history.entitiesByKey[lastKey] ?? null);
    }
  }
  return conversationTurns(conversation).at(-1) ?? null;
}

/** 倒序找第一个有 turnId 的 turn（原版 Pg）。 */
export function lastTurnWithTurnId(conversation: ConversationLike): AnyTurn | null {
  return findLastTurn(conversation, (turn) => turn.turnId != null);
}

/** 倒序找第一个可延续的 turn（有 id 或未终态，原版 Fg）。 */
export function lastIncompleteTurn(conversation: ConversationLike): AnyTurn | null {
  return findLastTurn(
    conversation,
    (turn) =>
      turn.turnId != null || (turn.status !== `completed` && turn.status !== `failed`),
  );
}

/** 历史是否已完整加载（原版 Ig）：compact 源或任一 turn 未加载全 → false；
 *  canonical 看 isComplete + 单岛；legacy 看 resumed + hasLoadedOldest。 */
export function hasCompleteHistory(conversation: ConversationLike): boolean {
  return conversation.turnsPagination?.source === `compact` || !allTurnsLoadedOldest(conversation)
    ? false
    : conversation.turnHistory?.kind === `canonical` &&
        (conversation.turnHistory as any).history.isComplete &&
        (conversation.turnHistory as any).history.islands.length === 1
      ? true
      : legacyHistoryComplete(conversation);
}

/** 所有 turn 的 items 都已加载到最老（原版 Lg）。 */
function allTurnsLoadedOldest(conversation: ConversationLike): boolean {
  return conversationTurns(conversation).every(
    (turn) => turn.itemsPagination?.hasLoadedOldest !== false,
  );
}

/** legacy 路径完整（resumed + hasLoadedOldest，原版 Rg）。 */
function legacyHistoryComplete(conversation: ConversationLike): boolean {
  return (
    conversation.turnHistory?.kind !== `canonical` &&
    conversation.resumeState === `resumed` &&
    (conversation.turnsPagination?.hasLoadedOldest ?? true)
  );
}

/** 倒序找第一个满足谓词的 turn（双路径，原版 zg）。 */
export function findLastTurn(
  conversation: ConversationLike,
  predicate: (turn: AnyTurn) => boolean,
): AnyTurn | null {
  if (conversation.turnHistory?.kind === `canonical`) {
    let { history } = conversation.turnHistory as any;
    let island = exhaustedTailIsland(history);
    if (island != null)
      for (let index = island.entries.length - 1; index >= 0; --index) {
        let key = island.entries[index]?.value;
        let entity = key == null ? null : history.entitiesByKey[key];
        if (entity != null && predicate(entity)) return entity;
      }
  }
  let turns = conversationTurns(conversation);
  for (let index = turns.length - 1; index >= 0; --index) {
    let turn = turns[index];
    if (turn != null && predicate(turn)) return turn;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 列表 → history 构造（原版 kge/Age）
// ---------------------------------------------------------------------------

/** turn 列表 → 完整单岛 history（原版 kge）：按 mergeTurn 去重同 turnId。
 *  注意：产出岛的 entry 形态是 {key, turn}（实体直持），仅供
 *  historyIslandTurns/completeHistoryTurns 提取，不进入常规拓扑维护。 */
export function historyFromTurns(
  island: { id: string; entries: { turn: AnyTurn }[] },
  options: { mergeTurn?: (existing: AnyTurn, incoming: AnyTurn) => AnyTurn } = {},
): CanonicalHistory {
  let mergeTurn = options.mergeTurn ?? ((_existing: AnyTurn, incoming: AnyTurn) => incoming);
  let entries = dedupeHistoryEntries(
    island.entries.map((entry, index) => ({ key: `${island.id}:${index}`, turn: entry.turn })),
    mergeTurn,
  );
  return {
    isComplete: true,
    islands: [
      {
        id: island.id,
        entries,
        olderBoundary: { status: `exhausted` },
        newerBoundary: { status: `exhausted` },
      },
    ],
  } as any;
}

/** 同 turnId 的 entry 合并为一（保留首现位置，原版 Age）。 */
export function dedupeHistoryEntries(
  entries: { key: string; turn: AnyTurn }[],
  mergeTurn: (existing: AnyTurn, incoming: AnyTurn) => AnyTurn,
): { key: string; turn: AnyTurn }[] {
  let result: { key: string; turn: AnyTurn }[] = [];
  let firstIndexByTurnId = new Map();
  for (let entry of entries) {
    let turnId = entry.turn.turnId;
    if (turnId == null) {
      result.push(entry);
      continue;
    }
    let firstIndex = firstIndexByTurnId.get(turnId);
    if (firstIndex == null) {
      firstIndexByTurnId.set(turnId, result.length);
      result.push(entry);
      continue;
    }
    let first = result[firstIndex];
    result[firstIndex] = { ...first, turn: mergeTurn(first.turn, entry.turn) };
  }
  return result;
}

// ---------------------------------------------------------------------------
// island 拓扑操作（原版 Hg..e_）
// ---------------------------------------------------------------------------

/** timeline 条目的稳定 key（原版 Hg）。 */
export function timelineEntryKey(entry: any): string {
  return entry.type === `item`
    ? JSON.stringify([entry.type, entry.turnId, entry.item.id])
    : entry.type === `realtime`
      ? `${entry.type}:${entry.item.id}`
      : `${entry.type}:${entry.turnId}`;
}

/** timeline 索引合并适配器（拓扑操作用的三元组）。 */
export interface HistoryMergeAdapter {
  getIdentity(value: string): string | null;
  getPosition(entry: HistoryEntry): number;
  merge(existing: any, incoming: any): any;
}

/** 追加一个新岛（原版 Fge；岛 id 重复抛错）。 */
export function appendHistoryIsland(
  history: CanonicalHistory,
  segment: {
    id: string;
    entries: { key: string; value: string }[];
    olderBoundary: HistoryBoundary;
    newerBoundary: HistoryBoundary;
  },
  adapter: HistoryMergeAdapter,
): CanonicalHistory {
  if (history.islands.some((island) => island.id === segment.id))
    throw Error(`Duplicate history island ID: ${segment.id}`);
  let island = {
    id: segment.id,
    entries: mergeEntryLists([], segment.entries, adapter),
    olderBoundary: ensureBoundaryId(segment.olderBoundary, `${segment.id}:older`),
    newerBoundary: ensureBoundaryId(segment.newerBoundary, `${segment.id}:newer`),
  };
  return withIslands(history, rebuildIslands(history.islands, island, adapter));
}

/**
 * 在边界上应用一段历史（原版 Ige）：generation 不符 → stale；找不到匹配
 * 边界的岛 → rejected；该边界已有相同 progress 的 available 记录 →
 * rejected；否则合并条目并更新岛的对应边界 → applied（返回新拓扑）。
 */
export function applyHistoryBoundarySegment(
  history: CanonicalHistory,
  segment: {
    boundary: BoundaryHandle;
    segment: {
      entries: { key: string; value: string }[];
      olderBoundary: HistoryBoundary;
      newerBoundary: HistoryBoundary;
    };
  },
  adapter: HistoryMergeAdapter,
): { status: `applied` | `rejected` | `stale`; topology: CanonicalHistory } {
  if (segment.boundary.generation !== history.generation)
    return { status: `stale`, topology: history };
  let islandIndex = findIslandForBoundary(history.islands, segment.boundary);
  let island = islandIndex == null ? null : history.islands[islandIndex];
  if (island == null) return { status: `rejected`, topology: history };
  let incomingBoundary =
    segment.boundary.edge === `older` ? segment.segment.olderBoundary : segment.segment.newerBoundary;
  if (
    incomingBoundary.status === `available` &&
    incomingBoundary.progressKey === segment.boundary.progressKey
  )
    return { status: `rejected`, topology: history };
  let nextBoundary = { ...incomingBoundary, boundaryId: segment.boundary.boundaryId };
  let updatedIsland = {
    id: island.id,
    entries: mergeEntryLists(island.entries, segment.segment.entries, adapter),
    olderBoundary: segment.boundary.edge === `older` ? nextBoundary : island.olderBoundary,
    newerBoundary: segment.boundary.edge === `newer` ? nextBoundary : island.newerBoundary,
  };
  return {
    status: `applied`,
    topology: withIslands(history, rebuildIslands(history.islands, updatedIsland, adapter, island)),
  };
}

/**
 * 重建岛列表（原版 Wg）：新岛与既有岛按位置区间重叠分组，重叠组合并为
 * 单岛（保留最外边界，取「最后」岛的 id）；按首位置排序；校验 id 唯一。
 */
function rebuildIslands(
  islands: HistoryIsland[],
  island: HistoryIsland,
  adapter: HistoryMergeAdapter,
  replacedIsland: HistoryIsland | null = null,
): HistoryIsland[] {
  let islandRange = islandPositionRange(island, adapter);
  if (islandRange == null && islands.some((existing) => existing !== replacedIsland))
    throw Error(`Cannot place an empty history island`);
  let overlapping = islands.filter((existing) => {
    if (existing === replacedIsland) return false;
    let range = islandPositionRange(existing, adapter);
    return range != null && rangesOverlap(range, islandRange!);
  });
  let removed = new Set(overlapping);
  if (replacedIsland != null) removed.add(replacedIsland);
  let merged =
    overlapping.length === 0 ? island : mergeIslandGroup(overlapping, island, adapter);
  let result = [...islands.filter((existing) => !removed.has(existing)), merged].sort((a, b) =>
    compareIslandsBy(a, b, `first`, adapter),
  );
  assertIslandsUnique(result);
  return result;
}

/** 重叠岛组合并（原版 Lge）：条目拼接去重，边界取组内最老/最新。 */
function mergeIslandGroup(
  islands: HistoryIsland[],
  island: HistoryIsland,
  adapter: HistoryMergeAdapter,
): HistoryIsland {
  let entries = islands.flatMap((existing) => existing.entries);
  let group = [...islands, island];
  let oldest = group.reduce((a, b) => (compareIslandsBy(b, a, `first`, adapter) < 0 ? b : a));
  let newest = group.reduce((a, b) => (compareIslandsBy(b, a, `last`, adapter) > 0 ? b : a));
  return {
    id: newest.id,
    entries: mergeEntryLists(entries, island.entries, adapter),
    olderBoundary: oldest.olderBoundary,
    newerBoundary: newest.newerBoundary,
  };
}

/** 两组 entry 合并（按 adapter identity 去重，位置排序，原版 Gg）。 */
function mergeEntryLists(
  existing: HistoryEntry[],
  incoming: HistoryEntry[],
  adapter: HistoryMergeAdapter,
): HistoryEntry[] {
  let result: HistoryEntry[] = [];
  let indexByIdentity = new Map();
  for (let entry of [...existing, ...incoming]) {
    let identity = adapter.getIdentity(entry.value!);
    let firstIndex = identity == null ? void 0 : indexByIdentity.get(identity);
    if (firstIndex == null) {
      if (identity != null) indexByIdentity.set(identity, result.length);
      result.push(entry);
      continue;
    }
    let first = result[firstIndex];
    result[firstIndex] = { ...first, value: adapter.merge(first.value, entry.value) };
  }
  return result.sort((a, b) => comparePositions(adapter.getPosition(a), adapter.getPosition(b)));
}

/** 岛的 entry 位置区间（原版 Kg；空岛 null）。 */
function islandPositionRange(
  island: HistoryIsland,
  adapter: HistoryMergeAdapter,
): { first: number; last: number } | null {
  let first = island.entries[0];
  if (first == null) return null;
  let min = adapter.getPosition(first);
  let max = min;
  for (let entry of island.entries.slice(1)) {
    let position = adapter.getPosition(entry);
    if (position < min) min = position;
    if (position > max) max = position;
  }
  return { first: min, last: max };
}

/** 位置区间是否重叠（原版 qg）。 */
function rangesOverlap(a: { first: number; last: number }, b: { first: number; last: number }): boolean {
  return a.first <= b.last && b.first <= a.last;
}

/** 按首/尾位置比较两岛（原版 Jg）。 */
function compareIslandsBy(
  a: HistoryIsland,
  b: HistoryIsland,
  edge: `first` | `last`,
  adapter: HistoryMergeAdapter,
): number {
  let rangeA = islandPositionRange(a, adapter);
  let rangeB = islandPositionRange(b, adapter);
  return rangeA == null || rangeB == null ? 0 : comparePositions(rangeA[edge], rangeB[edge]);
}

/** 位置比较（-1/0/1，原版 Yg）。 */
function comparePositions(a: number, b: number): number {
  return a < b ? -1 : +(a > b);
}

/** 找边界句柄匹配的岛（原版 Xg）：id 精确匹配不唯一语义 → null；
 *  无 id 匹配时按边界状态扫描，多于一个匹配 → null。 */
function findIslandForBoundary(
  islands: HistoryIsland[],
  boundary: BoundaryHandle,
): number | null {
  let byId = islands.findIndex((island) => island.id === boundary.islandId);
  if (byId !== -1) {
    let island = islands[byId];
    return island != null && islandMatchesBoundary(island, boundary) ? byId : null;
  }
  let found: number | null = null;
  for (let [index, island] of islands.entries())
    if (islandMatchesBoundary(island, boundary)) {
      if (found != null) return null;
      found = index;
    }
  return found;
}

/** 岛的对应边界是否与句柄匹配（原版 Zg）。 */
function islandMatchesBoundary(island: HistoryIsland, boundary: BoundaryHandle): boolean {
  let islandBoundary = boundary.edge === `older` ? island.olderBoundary : island.newerBoundary;
  return (
    islandBoundary.status === `available` &&
    islandBoundary.boundaryId === boundary.boundaryId &&
    islandBoundary.progressKey === boundary.progressKey
  );
}

/** 校验岛/边界 id 唯一（原版 Qg）。 */
function assertIslandsUnique(islands: HistoryIsland[]): void {
  let islandIds = new Set();
  let boundaryIds = new Set();
  for (let island of islands) {
    if (islandIds.has(island.id)) throw Error(`Duplicate history island ID: ${island.id}`);
    islandIds.add(island.id);
    for (let boundary of [island.olderBoundary, island.newerBoundary])
      if (boundary.boundaryId != null) {
        if (boundaryIds.has(boundary.boundaryId))
          throw Error(`Duplicate history boundary ID: ${boundary.boundaryId}`);
        boundaryIds.add(boundary.boundaryId);
      }
  }
}

/** 边界缺 id 时补默认（原版 $g）。 */
function ensureBoundaryId(boundary: HistoryBoundary, defaultId: string): HistoryBoundary {
  return boundary.boundaryId == null ? { ...boundary, boundaryId: defaultId } : boundary;
}

/** 替换岛列表并重算 isComplete（原版 e_）。 */
function withIslands(history: CanonicalHistory, islands: HistoryIsland[]): CanonicalHistory {
  let single = islands.length === 1 ? islands[0] : null;
  return {
    ...history,
    islands,
    isComplete:
      single?.olderBoundary.status === `exhausted` && single.newerBoundary.status === `exhausted`,
  };
}

// ---------------------------------------------------------------------------
// 边界页恢复（原版 t_/n_/r_/i_）—— 依赖 history-requests 的请求面，故
// 实现在 turns/history-requests.ts（restoreHistoryBoundaryPage）。
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// gap 视图（原版 a_/o_/s_/c_/Rge）
// ---------------------------------------------------------------------------

/** 历史分段：content（实体）或 gap（两岛间的可加载空档）。 */
export type HistorySegment =
  | { type: `content`; key: string; value: string }
  | {
      type: `gap`;
      key: string;
      olderIslandId: string | null;
      olderBoundaryRef: BoundaryHandle | null;
      newerIslandId: string | null;
      newerBoundaryRef: BoundaryHandle | null;
    };

/** 列出历史分段（岛间 available 边界产生 gap，原版 a_）。 */
export function listHistorySegments(history: CanonicalHistory): HistorySegment[] {
  let segments: HistorySegment[] = [];
  for (let [index, island] of history.islands.entries()) {
    if (index === 0 && island.olderBoundary.status === `available`)
      segments.push({
        type: `gap`,
        key: historyGapKey(null, boundaryKey(island, `older`)),
        olderIslandId: null,
        olderBoundaryRef: null,
        newerIslandId: island.id,
        newerBoundaryRef: boundaryRef(history, island, `older`),
      });
    for (let entry of island.entries)
      segments.push({ type: `content`, key: `history-content:${entry.key}`, value: entry.value });
    let nextIsland = history.islands[index + 1];
    if (nextIsland == null) {
      if (island.newerBoundary.status === `available`)
        segments.push({
          type: `gap`,
          key: historyGapKey(boundaryKey(island, `newer`), null),
          olderIslandId: island.id,
          olderBoundaryRef: boundaryRef(history, island, `newer`),
          newerIslandId: null,
          newerBoundaryRef: null,
        });
    } else
      segments.push({
        type: `gap`,
        key: historyGapKey(boundaryKey(island, `newer`), boundaryKey(nextIsland, `older`)),
        olderIslandId: island.id,
        olderBoundaryRef: boundaryRef(history, island, `newer`),
        newerIslandId: nextIsland.id,
        newerBoundaryRef: boundaryRef(history, nextIsland, `older`),
      });
  }
  return segments;
}

/** gap key（原版 o_）。 */
function historyGapKey(olderKey: string | null, newerKey: string | null): string {
  return `history-gap:${JSON.stringify([olderKey, newerKey])}`;
}

/** available 边界的完整句柄（原版 s_；exhausted → null）。 */
function boundaryRef(
  history: CanonicalHistory,
  island: HistoryIsland,
  edge: 'older' | 'newer',
): BoundaryHandle | null {
  let boundary = edge === `older` ? island.olderBoundary : island.newerBoundary;
  return boundary.status === `available`
    ? {
        boundaryId: boundary.boundaryId!,
        edge,
        generation: history.generation,
        handle: boundary.handle!,
        islandId: island.id,
        progressKey: boundary.progressKey!,
      }
    : null;
}

/** 边界的稳定 key（原版 c_）。 */
function boundaryKey(island: HistoryIsland, edge: 'older' | 'newer'): string {
  let boundary = edge === `older` ? island.olderBoundary : island.newerBoundary;
  return boundary.boundaryId == null ? `island:${island.id}:${edge}` : `boundary:${boundary.boundaryId}`;
}

// ---------------------------------------------------------------------------
// history 构建（原版 l_/u_/d_/f_）与应用（原版 p_/m_）
// ---------------------------------------------------------------------------

/** 已加载全的尾部 history（older 边界 exhausted，原版 l_）。 */
export function buildExhaustedTailHistory(
  turns: AnyTurn[],
  generation: number,
  policy?: any,
): CanonicalHistory {
  return buildTailHistory(turns, null, generation, true, policy);
}

/** 有 older 游标的尾部 history（原版 u_）。 */
export function buildBoundedTailHistory(
  turns: AnyTurn[],
  olderCursor: { source: string; cursor: string | null; oldestLoadedTurnId: string | null },
  generation: number,
  policy?: any,
): CanonicalHistory {
  return buildTailHistory(turns, olderCursor, generation, false, policy);
}

/** 未加载全、无游标的开放尾部 history（原版 d_）。 */
export function buildOpenTailHistory(
  turns: AnyTurn[],
  generation: number,
  policy?: any,
): CanonicalHistory {
  return buildTailHistory(turns, null, generation, false, policy);
}

/** 尾部 history 构建（原版 f_）：turn 列表 → 单岛 entitiesByKey，
 *  同 turnId 的实体经 mergeTurnLists 合并。 */
function buildTailHistory(
  turns: AnyTurn[],
  olderCursor: { source: string; cursor: string | null; oldestLoadedTurnId: string | null } | null,
  generation: number,
  isComplete = true,
  policy?: any,
): CanonicalHistory {
  let islandId = `tail:${generation}`;
  let entitiesByKey: Record<string, AnyTurn> = {};
  let entries: HistoryEntry[] = [];
  for (let [index, turn] of turns.entries()) {
    let key = turn.turnId == null ? `${islandId}:local:${index}` : `turn:${turn.turnId}`;
    let existing = entitiesByKey[key];
    if (existing == null) {
      entitiesByKey[key] = turn;
      entries.push({ key, value: key });
      continue;
    }
    let merged = mergeTurnLists([existing], [turn], { policy })[0];
    if (merged == null) throw Error(`Conversation history turn merge failed`);
    entitiesByKey[key] = merged;
  }
  return {
    entitiesByKey,
    generation,
    isComplete,
    islands: [
      {
        id: islandId,
        entries,
        olderBoundary:
          olderCursor == null
            ? { status: `exhausted`, boundaryId: `${islandId}:older` }
            : {
                status: `available`,
                boundaryId: `${islandId}:older`,
                handle: olderCursor,
                progressKey: JSON.stringify([olderCursor.cursor, olderCursor.oldestLoadedTurnId]),
              },
        newerBoundary: { status: `exhausted`, boundaryId: `${islandId}:newer` },
      },
    ],
  };
}

/** 应用 turn 列表到 conversation draft（原版 p_）：canonical 走 m_，
 *  legacy 直接替换 turns。 */
export function applyConversationTurns(
  conversation: ConversationLike,
  turns: AnyTurn[],
  hasLoadedOldest: boolean,
  pagination: any,
  policy?: any,
): void {
  if (conversation.turnHistory?.kind === `canonical`) {
    applyCanonicalTurns(conversation, turns, hasLoadedOldest, pagination, policy);
    return;
  }
  conversation.turns = turns.map(freezeIdentity);
}

/** canonical 路径应用（原版 m_）：generation+1 重建尾部岛，清空 legacy
 *  turns（canonical 后 turns 只存放本地占位 turn）。maybe-resume 的最终
 *  应用按 manager.canonicalTurnHistory 分派到此或 applyConversationTurns。 */
export function applyCanonicalTurns(
  conversation: ConversationLike,
  turns: AnyTurn[],
  hasLoadedOldest: boolean,
  pagination: { source: string; cursor: string | null; oldestLoadedTurnId: string | null } | null,
  policy?: any,
): void {
  let generation =
    conversation.turnHistory?.kind === `canonical`
      ? (conversation.turnHistory as any).history.generation + 1
      : 0;
  let settledTurns = turns.map((turn) =>
    turn.itemsPagination?.isLoadingOlder
      ? { ...turn, itemsPagination: { ...turn.itemsPagination, isLoadingOlder: false } }
      : turn,
  );
  conversation.turnHistory = {
    kind: `canonical`,
    history: freezeIdentity(
      hasLoadedOldest
        ? buildExhaustedTailHistory(settledTurns, generation, policy)
        : pagination == null
          ? buildOpenTailHistory(settledTurns, generation, policy)
          : buildBoundedTailHistory(settledTurns, pagination, generation, policy),
    ),
  };
  conversation.turns = [];
}

/** Append a local turn at the live tail (original `T_`/`E_`). */
export function appendConversationTurn(
  conversation: ConversationLike,
  turn: AnyTurn,
  createSearchIslandId: () => string,
): AnyTurn {
  let frozen = freezeIdentity(turn);
  let history = canonicalHistory(conversation);
  if (history == null) {
    conversation.turns.push(frozen);
    return frozen;
  }
  let island = exhaustedTailIsland(history);
  if (island == null) {
    let islandId = `local-live-tail:${createSearchIslandId()}`;
    island = {
      id: islandId,
      entries: [],
      olderBoundary: { status: `exhausted`, boundaryId: `${islandId}:older` },
      newerBoundary: { status: `exhausted`, boundaryId: `${islandId}:newer` },
    };
    history.islands.push(island);
    history.isComplete = false;
  }
  let entityKey = `${island.id}:local:${createSearchIslandId()}`;
  island.entries.push({ key: entityKey, value: entityKey });
  history.entitiesByKey[entityKey] = frozen;
  return frozen;
}

// ---------------------------------------------------------------------------
// turn 定位（原版 h_/g_/__/v_/y_/b_/zge/x_）
// ---------------------------------------------------------------------------

/** 最新 turn（原版 h_）。 */
export function latestTurn(conversation: ConversationLike): AnyTurn | null {
  return findLatestTurnEntry(conversation)?.turn ?? null;
}

/** 最新 turn 及其 entityKey（原版 g_）。 */
export function findLatestTurnEntry(
  conversation: ConversationLike,
): { entityKey: string; turn: AnyTurn } | null {
  let history = canonicalHistory(conversation);
  if (history != null) {
    let lastKey = exhaustedTailIsland(history)?.entries.at(-1)?.value;
    if (lastKey != null) {
      let turn = history.entitiesByKey[lastKey];
      return turn == null ? null : { entityKey: lastKey, turn };
    }
  }
  return findTurnEntry(conversation, () => true);
}

/** 正序找第一个满足谓词的实体（原版 __）。 */
export function findTurnEntity(
  conversation: ConversationLike,
  predicate: (turn: AnyTurn) => boolean,
): AnyTurn | null {
  let history = canonicalHistory(conversation);
  if (history != null) {
    for (let island of history.islands)
      for (let { value } of island.entries) {
        let turn = history.entitiesByKey[value];
        if (turn != null && predicate(turn)) return turn;
      }
    return null;
  }
  return conversation.turns.find(predicate) ?? null;
}

/** 倒序找满足谓词的 turn（draft 场景，原版 v_）。 */
export function findDraftTurn(conversation: ConversationLike, predicate: (turn: AnyTurn) => boolean): AnyTurn | null {
  return findTurnEntry(conversation, predicate)?.turn ?? null;
}

/** 倒序找满足谓词的 turn 及其 entityKey（原版 y_；legacy 的本地 turn key
 *  用 `legacy:<index>`，server turn 用 `turn:<turnId>`）。 */
export function findTurnEntry(
  conversation: ConversationLike,
  predicate: (turn: AnyTurn) => boolean,
): { entityKey: string; turn: AnyTurn } | null {
  let history = canonicalHistory(conversation);
  if (history != null) {
    for (let index = history.islands.length - 1; index >= 0; --index) {
      let island = history.islands[index];
      if (island != null)
        for (let entryIndex = island.entries.length - 1; entryIndex >= 0; --entryIndex) {
          let key = island.entries[entryIndex]?.value;
          let turn = key == null ? null : history.entitiesByKey[key];
          if (key != null && turn != null && predicate(turn)) return { entityKey: key, turn };
        }
    }
    return null;
  }
  for (let index = conversation.turns.length - 1; index >= 0; --index) {
    let turn = conversation.turns[index];
    if (turn != null && predicate(turn))
      return {
        entityKey: turn.turnId == null ? `legacy:${index}` : `turn:${turn.turnId}`,
        turn,
      };
  }
  return null;
}

/** 遍历全部 turn（双路径，原版 b_）。 */
export function forEachTurn(conversation: ConversationLike, callback: (turn: AnyTurn) => void): void {
  let history = canonicalHistory(conversation);
  if (history != null) {
    for (let island of history.islands)
      for (let { value } of island.entries) {
        let turn = history.entitiesByKey[value];
        if (turn != null) callback(turn);
      }
    return;
  }
  conversation.turns.forEach(callback);
}

/** 把所有 inProgress 的 commandExecution 标记为 interrupted（原版 zge）。 */
export function markInterruptedCommandExecutions(conversation: ConversationLike): void {
  forEachTurn(conversation, (turn) => {
    let interrupted =
      (turn as any).interruptedCommandExecutionItemIds == null
        ? new Set()
        : new Set((turn as any).interruptedCommandExecutionItemIds);
    let changed = false;
    for (let item of turn.items)
      if (item.type === `commandExecution` && `status` in item && item.status === `inProgress`) {
        interrupted.add(item.id);
        changed = true;
      }
    if (changed) (turn as any).interruptedCommandExecutionItemIds = [...interrupted];
  });
}

/** 从 conversation 中移除 turn 实体（原版 x_）：canonical 时从岛中摘除
 *  entry 并删实体；尾岛清空且未完整时连岛一起删。 */
export function removeTurn(conversation: ConversationLike, turn: AnyTurn): void {
  let history = canonicalHistory(conversation);
  if (history != null) {
    for (let islandIndex = 0; islandIndex < history.islands.length; islandIndex += 1) {
      let island = history.islands[islandIndex];
      if (island == null) continue;
      let entryIndex = island.entries.findIndex(
        ({ value }) => history.entitiesByKey[value] === turn,
      );
      if (entryIndex >= 0) {
        let key = island.entries[entryIndex]?.value;
        island.entries.splice(entryIndex, 1);
        if (key != null) delete history.entitiesByKey[key];
        if (island.entries.length === 0 && island === exhaustedTailIsland(history) && !history.isComplete)
          history.islands.splice(islandIndex, 1);
        return;
      }
    }
    return;
  }
  let index = conversation.turns.indexOf(turn);
  if (index >= 0) conversation.turns.splice(index, 1);
}

// ---------------------------------------------------------------------------
// turn 事件定位（原版 O_/D_/k_，31,590-31,686）
// ---------------------------------------------------------------------------

/** O_ 的宿主服务面（logger + createId）。 */
export interface TurnEventHost {
  logger: any;
  createId?: (() => string) | null;
}

/** 事件定位选项。 */
export interface FindTurnOptions {
  rebindLatestInProgressPlaceholder?: boolean;
  synthesizeMissingTurn?: boolean;
}

/**
 * 按 turnId 定位事件归属的 turn 及其 entityKey（原版 O_）。
 *
 * 顺序：无 turnId → 最新 turn；精确匹配 → 该 turn；否则依次尝试：
 *   1. rebindLatestInProgressPlaceholder：最新 turn 是本地 inProgress
 *      占位（未入场）→ 把事件 turnId 绑上去；
 *   2. 会话只有一个 turn 且是空占位 → 同上（并重置输入为空）；
 *   3. synthesizeMissingTurn（或占位带 pendingUserMessageAdmission）→
 *      以最新 turn 参数为模板合成新 turn 追加；
 *   4. 全部失败 → 记 error 返回 null。
 */
export function findTurnEntryForEvent(
  conversation: ConversationLike,
  turnId: string | null,
  host: TurnEventHost,
  options?: FindTurnOptions,
): { entityKey: string; turn: AnyTurn } | null {
  let latest = findLatestTurnEntry(conversation);
  if (latest == null) {
    host.logger.error(`No turns for conversation`, {
      safe: { conversationId: conversation.id },
      sensitive: {},
    });
    return null;
  }
  let latestTurn = latest.turn;
  if (!turnId) return latest;
  let exact = findTurnEntry(conversation, (turn) => turn.turnId === turnId);
  if (exact) return exact;
  if (
    options?.rebindLatestInProgressPlaceholder &&
    !(latestTurn as any).pendingUserMessageAdmission &&
    latestTurn.turnId == null &&
    latestTurn.status === `inProgress`
  )
    return (
      (latestTurn.turnId = turnId),
      (latestTurn.turnStartedAtMs = latestTurn.turnStartedAtMs ?? Date.now()),
      conversation.turnHistory?.kind === `canonical`
        ? latest
        : { entityKey: `turn:${turnId}`, turn: latestTurn }
    );
  if (historyTurnCount(conversation) === 1 && isPlaceholderTurnMutable(latestTurn))
    return (
      host.logger.warning(`Rebinding placeholder latest turn to incoming event`, {
        safe: { turnId, conversationId: conversation.id },
        sensitive: {},
      }),
      (latestTurn.params.input = []),
      (latestTurn.turnId = turnId),
      (latestTurn.turnStartedAtMs = latestTurn.turnStartedAtMs ?? Date.now()),
      (latestTurn.status = `inProgress`),
      conversation.turnHistory?.kind === `canonical`
        ? latest
        : { entityKey: `turn:${turnId}`, turn: latestTurn }
    );
  if (
    options?.synthesizeMissingTurn ||
    (options?.rebindLatestInProgressPlaceholder && (latestTurn as any).pendingUserMessageAdmission)
  ) {
    host.logger.warning(`Synthesizing missing turn for incoming event`, {
      safe: { turnId, conversationId: conversation.id },
      sensitive: {},
    });
    if (host.createId == null) return null;
    let templateParams = Object.assign({}, latestTurn.params, {
      input: [],
      clientUserMessageId: null,
      personality: null,
      outputSchema: null,
      collaborationMode: null,
      attachments: [],
    });
    appendLocalTurnForEvent(
      conversation,
      Object.assign({}, latestTurn, {
        pendingUserMessageAdmission: void 0,
        localMetadata: void 0,
        requestTraceId: void 0,
        requestedReasoningEffort: void 0,
        params: templateParams,
        turnId,
        turnStartedAtMs: Date.now(),
        durationMs: null,
        firstTurnWorkItemStartedAtMs: null,
        finalAssistantStartedAtMs: null,
        status: `inProgress`,
        error: null,
        diff: null,
        items: [],
        itemsPagination: { olderCursor: null, isLoadingOlder: false, hasLoadedOldest: false },
      } as AnyTurn),
      host.createId,
    );
    return findLatestTurnEntry(conversation);
  }
  host.logger.error(`Turn not found for event`, {
    safe: { turnId, conversationId: conversation.id },
    sensitive: {},
  });
  return null;
}

/** 空占位 turn 判定（原版 xg，重绑定判定用）。 */
function isPlaceholderTurnMutable(turn: AnyTurn): boolean {
  return (
    turn.turnId == null &&
    turn.turnStartedAtMs == null &&
    turn.status === `completed` &&
    turn.error == null &&
    turn.items.length === 0
  );
}

/** 事件定位 + 追加合成 turn 的本地入口（E_ 的直通形态）。 */
function appendLocalTurnForEvent(
  conversation: ConversationLike,
  turn: AnyTurn,
  createId: () => string,
): AnyTurn {
  let frozen = freezeIdentity(turn);
  let history = canonicalHistory(conversation);
  if (history != null) {
    let island = exhaustedTailIsland(history);
    if (island == null) {
      let islandId = `local-live-tail:${createId()}`;
      island = {
        id: islandId,
        entries: [],
        olderBoundary: { status: `exhausted`, boundaryId: `${islandId}:older` },
        newerBoundary: { status: `exhausted`, boundaryId: `${islandId}:newer` },
      };
      history.islands.push(island);
      history.isComplete = false;
    }
    let key = `${island.id}:local:${createId()}`;
    island.entries.push({ key, value: key });
    history.entitiesByKey[key] = frozen;
    return frozen;
  }
  conversation.turns.push(frozen);
  return frozen;
}

/** 按 turnId 定位 turn（原版 D_）。 */
export function findTurnByTurnId(
  conversation: ConversationLike,
  turnId: string | null,
  host: TurnEventHost,
  options?: FindTurnOptions,
): AnyTurn | null {
  return findTurnEntryForEvent(conversation, turnId, host, options)?.turn ?? null;
}

/** 定位成功则应用修改（原版 k_）：返回是否找到并修改。 */
export function updateTurnIfFound(
  conversation: ConversationLike,
  turnId: string | null,
  mutate: (turn: AnyTurn) => void,
  host: TurnEventHost,
  options?: FindTurnOptions,
): boolean {
  let turn = findTurnByTurnId(conversation, turnId, host, options);
  return turn ? (mutate(turn), true) : false;
}

// ---------------------------------------------------------------------------
// 兼容导出（原版压缩名；R4/R5 manager 等按旧名 import；切换语义名后移除）
// ---------------------------------------------------------------------------

export {
  findTurnById as Ag,
  lastIncompleteTurn as Fg,
  completeHistoryEntities as Mg,
  findTurnAgentMessageText as Oge,
  mergedConversationTurns as kg,
};
