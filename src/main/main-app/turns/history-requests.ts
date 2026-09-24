// app-server 历史请求：thread/items/list、thread/turns/list、timeline 源、
// 尾部合并与边界页恢复。
//
// 原版 main-C-Mhak1n.ts 30,533-30,738（kge/Age 在 canonical-history；
// jge/Mge/Bg/Nge/Pge/Vg/Hg/Ug）、30,876-31,000（t_/n_/r_/i_）、
// 31,239-31,330（C_/w_）、31,694-31,823（j_/Hge）、31,824-31,981
//（M_/Uge/Wge/N_/P_/Gge）。
//
// 职责：
//   - C_/Wge：单 turn 的 items 分页读取（desc 为主，容错「decoded message
//     length too large」自动减半 limit）；
//   - w_：turns/list + items/list 并取（bounded cloud history 的 summary
//     视图、paginated host 的全量回填）；
//   - N_：durable（云端）host 的 turns/list + 并行 items 预取（步长 M_=5）；
//   - P_：timeline 源（voice/canonical 历史）——timeline/list + realtime
//     续页 + turns/list 元数据补齐 + 每 turn 的 opening user message 探测；
//   - jge/Mge（Bg）：tail 历史分页加载与合并（Kge.loadCurrentConversationTurns
//     的两个模式：完整 tail / 单页）；
//   - t_：canonical 边界页恢复（Ige 拓扑应用）；
//   - j_：resume 快照合并（fork/resume 后整表 reconcile）；
//   - Hge：resume 后把本地 turn 追加进 canonical history。

import { $u as normalizeThreadId, _s as DURABLE_HOST_ID, kd as defaultPermissions } from "@chunk/shared";
import { freezeIdentity, produce } from "../vendor/immer";
import { findLastIndex } from "../util/lodash-interop";
import {
  applyHistoryBoundarySegment,
  applyConversationTurns,
  canonicalHistory,
  completeHistoryTurns,
  conversationTurns,
  exhaustedTailIsland,
  historyFromTurns,
  lastTurn,
  mergedConversationTurns,
  timelineEntryKey,
  type AnyTurn,
  type BoundaryHandle,
  type CanonicalHistory,
  type ConversationLike,
  type HistoryEntry,
} from "./canonical-history";
import { mergeTurnLists, type TurnMergePolicy } from "./item-merge";
import { isUnboundSteeringMessage, recoverSteeringOrphans } from "./steering-merge";

/** durable host 的 turns/list 请求超时（原版 ym = 3e4）。 */
export const THREAD_HISTORY_REQUEST_TIMEOUT_MS = 30_000;
/** N_ 并行 items 预取的步长/并发（原版 M_ = 5）。 */
const ITEMS_PREFETCH_STRIDE = 5;
/** Wge 初始页大小（原版 Uge = 500；解码超长时逐次减半）。 */
const ALL_ITEMS_PAGE_LIMIT = 500;

/** 历史读取客户端（ThreadStore/连接适配器实现的请求面）。 */
export interface HistoryClient {
  getConversation(threadId: string): ConversationLike | null;
  getHostId(): string;
  sendRequest(method: string, params: any, options?: any): Promise<any>;
  listThreadTurns(threadId: string, options?: any): Promise<any>;
  updateConversationState(threadId: string, updater: (draft: any) => void, broadcast?: boolean): void;
  broadcastConversationSnapshot(threadId: string): void;
  supportsPaginatedThreadHistory(): boolean;
  getConversationTurnItemLimit(threadId: string): number;
  logger: any;
  [key: string]: unknown;
}

/** tail 合并策略（Kge 的 policy 参数实现面）。 */
export interface HistoryPolicy {
  turnMergePolicy: TurnMergePolicy;
  mergeTurns(existing: AnyTurn[], incoming: AnyTurn[], options?: any): AnyTurn[];
  mapThreadTurns(input: any): AnyTurn[];
  mapThreadItems(items: any[]): any[];
  applyOldestUserInput(turn: AnyTurn, item: any): void;
}

/**
 * 单 turn 的 items 分页（原版 C_）：desc 读取后反转回时间序；游标未前进
 * 抛错；返回的元素是 item 本体（剥离 {turnId, item} 包装并校验归属）。
 */
export async function listTurnItems(
  sendRequest: (method: string, params: any, options?: any) => Promise<any>,
  threadId: string,
  turnId: string,
  cursor: string | null,
  requestOptions?: any,
  limit: number = 100,
  sortDirection: 'asc' | 'desc' = `desc`,
): Promise<{ items: any[]; nextCursor: string | null }> {
  let response = await sendRequest(
    `thread/items/list`,
    { threadId, turnId, cursor, limit, sortDirection },
    requestOptions,
  );
  if (response.nextCursor != null && response.nextCursor === cursor)
    throw Error(`thread/items/list returned unchanged cursor for turn ${turnId}`);
  let items = response.data.map((entry: any) => {
    if (!(`item` in entry)) return entry;
    if (entry.turnId !== turnId)
      throw Error(`thread/items/list returned item for unexpected turn ${entry.turnId}`);
    return entry.item;
  });
  return { items: sortDirection === `desc` ? items.reverse() : items, nextCursor: response.nextCursor };
}

/**
 * 全量读取单 turn 的 items（原版 Wge，asc）：「decoded message length too
 * large」时 limit 减半重试；游标重复抛错。
 */
export async function listAllTurnItems(
  sendRequest: (method: string, params: any, options?: any) => Promise<any>,
  threadId: string,
  turnId: string,
  requestOptions?: any,
): Promise<any[]> {
  let items: any[] = [];
  let seenCursors = new Set<string>();
  let cursor: string | null = null;
  let limit = ALL_ITEMS_PAGE_LIMIT;
  for (;;) {
    let request = { threadId, turnId, cursor, limit, sortDirection: `asc` };
    let response: any;
    try {
      response = await sendRequest(`thread/items/list`, request, requestOptions);
    } catch (error) {
      if (limit > 1 && error instanceof Error && error.message.includes(`decoded message length too large`)) {
        limit = Math.floor(limit / 2);
        continue;
      }
      throw error;
    }
    let page = response.data;
    items.push(...page.map((entry: any) => (`item` in entry ? entry.item : entry)));
    if (response.nextCursor == null) return items;
    if (seenCursors.has(response.nextCursor))
      throw Error(`thread/items/list returned a repeated cursor for turn ${turnId}`);
    seenCursors.add(response.nextCursor);
    cursor = response.nextCursor;
  }
}

/**
 * turns/list + items/list 并取（原版 w_，11 参）。
 *
 * @param itemsView `notLoaded`（只取 turn 骨架）/ `summary`（每 turn 装满
 *   itemLimit 预算的尾部 items）/ `full`
 * @param backwardsCursor paginated host 的 items 回填游标（从该游标向前装）
 * @param fetchAllItemsInParallel durable host：先把所有 turn 的首页 items
 *   并行取回再串行补页
 */
export async function fetchTurnsWithItems(
  client: HistoryClient,
  itemLimit: number,
  policy: TurnMergePolicy,
  threadId: string,
  cursor: string | null,
  backwardsCursor: string | null,
  limit: number | null,
  requestOptions?: any,
  sortDirection?: 'asc' | 'desc' | null,
  itemsView?: string | null,
  fetchAllItemsInParallel: boolean = false,
): Promise<any> {
  let turnsResponse = await client.sendRequest(
    `thread/turns/list`,
    { threadId, cursor, limit, itemsView: `notLoaded`, sortDirection: sortDirection ?? `desc` },
    requestOptions,
  );
  if (itemsView === `notLoaded`) return { response: turnsResponse };
  let mergedTurns: AnyTurn[] = [];
  let itemsPaginationByTurnId: Record<string, any> = {};
  let conversation = client.getConversation(normalizeThreadId(threadId));
  let currentTurns = conversation == null ? null : mergedConversationTurns(conversation, policy);
  let oldestUserInputProbes: Promise<void>[] = [];
  let itemBudget = Math.min(limit ?? 5, 5) * 100;
  let parallelFirstPages = fetchAllItemsInParallel
    ? await Promise.all(
        turnsResponse.data.map((turn: any) =>
          listTurnItems(client.sendRequest.bind(client), threadId, turn.id, backwardsCursor, requestOptions, itemLimit),
        ),
      )
    : null;
  for (let [index, turn] of turnsResponse.data.entries()) {
    let itemCursor = backwardsCursor;
    let items: any[] = [];
    let loadedFirstPage = false;
    let seenCursors = new Set<string>();
    let seenItemIds = new Set<string>();
    // 从 backwardsCursor 装满 itemLimit 预算（或游标耗尽）。
    for (
      ;
      (!loadedFirstPage || itemCursor != null) && itemBudget > 0 && items.length < itemLimit;

    ) {
      if (seenCursors.has(itemCursor))
        throw Error(`thread/items/list repeated cursor ${itemCursor} for turn ${turn.id}`);
      seenCursors.add(itemCursor);
      let firstPage = parallelFirstPages?.[index];
      let page =
        !loadedFirstPage && firstPage != null
          ? firstPage
          : await listTurnItems(
              client.sendRequest.bind(client),
              threadId,
              turn.id,
              itemCursor,
              requestOptions,
              Math.min(100, itemBudget, itemLimit - items.length),
            );
      loadedFirstPage = true;
      let freshItems = page.items.filter(
        (item: any) => !seenItemIds.has(item.id) && (seenItemIds.add(item.id), true),
      );
      items.push(...freshItems.reverse());
      itemBudget -= freshItems.length;
      itemCursor = page.nextCursor;
    }
    items.reverse();
    let loadedAllItems = loadedFirstPage && itemCursor == null;
    mergedTurns.push({ ...turn, items, itemsView: loadedAllItems ? `full` : `summary` });
    let itemsPagination: any = {
      olderCursor: itemCursor,
      isLoadingOlder: false,
      hasLoadedOldest: loadedAllItems,
      newestSnapshotItemId: items.at(-1)?.id,
    };
    if (!loadedAllItems) {
      // 未装满：从本地 turn 恢复 opening user message 锚点，缺失时发起
      // asc 首页探测（取首个非 contextCompaction item）。
      let localTurn = currentTurns?.find(({ turnId }) => turnId === turn.id);
      let oldestUserInput =
        localTurn?.itemsPagination?.oldestUserInput ??
        (localTurn != null &&
        localTurn.itemsPagination?.hasLoadedOldest !== false &&
        localTurn.params.input.length > 0
          ? localTurn.params.input
          : void 0);
      if (oldestUserInput != null) {
        itemsPagination.oldestUserInput = oldestUserInput;
        itemsPagination.openingUserMessageClientId =
          localTurn?.itemsPagination?.oldestUserInput == null
            ? localTurn?.params.clientUserMessageId
            : localTurn.itemsPagination.openingUserMessageClientId;
      }
      let knownOpeningUserMessageId = localTurn?.itemsPagination?.openingUserMessageId;
      if (knownOpeningUserMessageId === void 0) {
        if (items.length > 0)
          oldestUserInputProbes.push(
            listTurnItems(client.sendRequest.bind(client), threadId, turn.id, null, requestOptions, 2, `asc`)
              .then(({ items: firstItems, nextCursor }) => {
                let firstMeaningful = firstItems.find((item: any) => item.type !== `contextCompaction`);
                if (firstMeaningful != null || (nextCursor == null && turn.status !== `inProgress`)) {
                  itemsPagination.oldestUserInput =
                    firstMeaningful?.type === `userMessage` ? firstMeaningful.content : [];
                  itemsPagination.openingUserMessageId =
                    firstMeaningful?.type === `userMessage` ? firstMeaningful.id : null;
                  itemsPagination.openingUserMessageClientId =
                    firstMeaningful?.type === `userMessage` ? firstMeaningful.clientId : null;
                }
              })
              .catch(() => void 0),
          );
      } else itemsPagination.openingUserMessageId = knownOpeningUserMessageId;
    }
    itemsPaginationByTurnId[turn.id] = itemsPagination;
  }
  await Promise.all(oldestUserInputProbes);
  return { response: { ...turnsResponse, data: mergedTurns }, itemsPaginationByTurnId };
}

/** durable（云端）host 的 turns/list（原版 N_）：itemsView 为 full 时按
 *  步长 5 并行地全量装 items（Wge）。 */
export async function listDurableTurnsWithItems(
  sendRequest: (method: string, params: any, options?: any) => Promise<any>,
  threadId: string,
  cursor: string | null,
  limit: number | null,
  requestOptions?: any,
  sortDirection?: 'asc' | 'desc' | null,
  itemsView?: string | null,
): Promise<any> {
  let options = { timeoutMs: THREAD_HISTORY_REQUEST_TIMEOUT_MS, ...requestOptions };
  let response = await sendRequest(
    `thread/turns/list`,
    { threadId, cursor, limit, itemsView: `notLoaded`, sortDirection: sortDirection ?? `desc` },
    options,
  );
  if (itemsView === `notLoaded` || itemsView === `summary`) return response;
  let turnsWithItems: any[] = Array(response.data.length);
  let loadTurnItemsAt = async (index: number) => {
    let turn = response.data[index];
    if (turn == null) return;
    let items = await listAllTurnItems(sendRequest, threadId, turn.id, options);
    turnsWithItems[index] = { ...turn, items, itemsView: `full` };
    await loadTurnItemsAt(index + ITEMS_PREFETCH_STRIDE);
  };
  await Promise.all(
    Array.from({ length: Math.min(response.data.length, ITEMS_PREFETCH_STRIDE) }, (_unused, index) =>
      loadTurnItemsAt(index),
    ),
  );
  return { ...response, data: turnsWithItems };
}

/**
 * timeline 源读取（原版 P_）：voice/canonical 历史。timeline/list（500/页）
 * 为主；首页前再取 turns/list 前 5 条补 turn 元数据；realtime-only 的页面
 * 继续向后翻直到出现非 realtime 条目（或到头）；timeline 中出现 turns/list
 * 未覆盖的 turnId 时按 100/页继续取 turns/list 补齐。每 turn 输出 items 与
 * pagination（含 opening user message 探测）。
 */
export async function listTimelineTurns(
  client: HistoryClient,
  threadId: string,
  cursor: string | null,
  requestOptions?: any,
): Promise<any> {
  let conversation = client.getConversation(normalizeThreadId(threadId));
  let existingTurns = conversation == null ? [] : conversationTurns(conversation);
  let turnMetadataById = new Map<string, any>();
  for (let turn of existingTurns)
    if (turn.turnId != null)
      turnMetadataById.set(turn.turnId, {
        id: turn.turnId,
        items: [],
        itemsView: `notLoaded`,
        status: turn.status,
        error: (turn as any).error,
        startedAt: turn.turnStartedAtMs == null ? null : turn.turnStartedAtMs / 1e3,
        completedAt:
          (turn as any).finalAssistantStartedAtMs == null ? null : (turn as any).finalAssistantStartedAtMs / 1e3,
        durationMs: (turn as any).durationMs ?? null,
      });
  let fetchTimelinePage = (pageCursor: string | null) =>
    client.sendRequest(`thread/timeline/list`, { threadId, cursor: pageCursor, limit: 500 }, requestOptions);
  let timeline = await fetchTimelinePage(cursor);
  if (timeline.nextCursor != null && timeline.nextCursor === cursor)
    throw Error(`thread/timeline/list returned a repeated cursor`);
  let turnsList =
    cursor == null
      ? await client.sendRequest(
          `thread/turns/list`,
          { threadId, limit: 5, itemsView: `notLoaded`, sortDirection: `desc` },
          requestOptions,
        )
      : null;
  for (let turn of turnsList?.data ?? []) turnMetadataById.set(turn.id, turn);
  let seenCursors = new Set([cursor]);
  for (;;) {
    if (timeline.nextCursor != null && seenCursors.has(timeline.nextCursor))
      throw Error(`thread/timeline/list returned a repeated cursor`);
    if (
      (conversation as any)?.canonicalVoiceHistory ||
      timeline.nextCursor == null ||
      timeline.data.some((entry: any) => entry.type !== `realtime`)
    )
      break;
    seenCursors.add(timeline.nextCursor);
    timeline = await fetchTimelinePage(timeline.nextCursor);
  }
  let itemsByTurnId = new Map<string, any[]>();
  let turnStartedIds = new Set<string>();
  for (let entry of timeline.data)
    if (entry.type !== `realtime`) {
      if (!itemsByTurnId.has(entry.turnId)) itemsByTurnId.set(entry.turnId, []);
      if (entry.type === `item`) itemsByTurnId.get(entry.turnId)?.push(entry.item);
      if (entry.type === `turnStarted`) turnStartedIds.add(entry.turnId);
      if (entry.type === `turnCompleted`)
        turnMetadataById.set(entry.turnId, {
          id: entry.turnId,
          items: [],
          itemsView: `notLoaded`,
          status: entry.status,
          error: entry.error,
          startedAt: entry.startedAt,
          completedAt: entry.completedAt,
          durationMs: entry.durationMs,
        });
    }
  let unknownTurnIds = new Set(
    [...itemsByTurnId.keys()].filter((turnId) => !turnMetadataById.has(turnId)),
  );
  let turnsListCursors = new Set<string | null>();
  for (; unknownTurnIds.size > 0 && (turnsList == null || turnsList.nextCursor != null);) {
    let nextCursor = turnsList?.nextCursor ?? null;
    if (turnsListCursors.has(nextCursor))
      throw Error(`thread/turns/list returned a repeated cursor`);
    turnsListCursors.add(nextCursor);
    turnsList = await client.sendRequest(
      `thread/turns/list`,
      { threadId, cursor: nextCursor, limit: 100, itemsView: `notLoaded`, sortDirection: `desc` },
      requestOptions,
    );
    for (let turn of turnsList.data)
      if (unknownTurnIds.delete(turn.id)) turnMetadataById.set(turn.id, turn);
  }
  let itemsPaginationByTurnId: Record<string, any> = {};
  let turns = await Promise.all(
    Array.from(itemsByTurnId, async ([turnId, items]) => {
      let metadata = turnMetadataById.get(turnId);
      if (metadata == null) throw Error(`Timeline turn metadata is unavailable`);
      let hasLoadedOldest = timeline.nextCursor == null || turnStartedIds.has(turnId);
      let itemsPagination: any = {
        source: `timeline`,
        olderCursor: null,
        isLoadingOlder: false,
        hasLoadedOldest,
        newestSnapshotItemId: items.at(-1)?.id,
      };
      let existingPagination = existingTurns.find((turn) => turn.turnId === turnId)?.itemsPagination;
      if (existingPagination?.openingUserMessageId !== void 0) {
        itemsPagination.oldestUserInput = existingPagination.oldestUserInput;
        itemsPagination.openingUserMessageId = existingPagination.openingUserMessageId;
        itemsPagination.openingUserMessageClientId = existingPagination.openingUserMessageClientId;
      } else if (!hasLoadedOldest) {
        let firstPage = await listTurnItems(
          client.sendRequest.bind(client),
          threadId,
          turnId,
          null,
          requestOptions,
          2,
          `asc`,
        ).catch(() => null);
        let firstMeaningful = firstPage?.items.find((item: any) => item.type !== `contextCompaction`);
        if (
          firstPage != null &&
          (firstMeaningful != null || (firstPage.nextCursor == null && metadata.status !== `inProgress`))
        ) {
          itemsPagination.oldestUserInput =
            firstMeaningful?.type === `userMessage` ? firstMeaningful.content : [];
          itemsPagination.openingUserMessageId =
            firstMeaningful?.type === `userMessage` ? firstMeaningful.id : null;
          itemsPagination.openingUserMessageClientId =
            firstMeaningful?.type === `userMessage` ? firstMeaningful.clientId : null;
        }
      }
      itemsPaginationByTurnId[turnId] = itemsPagination;
      return { ...metadata, items, itemsView: hasLoadedOldest ? `full` : `summary` };
    }),
  );
  return {
    source: `timeline`,
    timeline,
    response: { data: turns.reverse(), nextCursor: timeline.nextCursor, backwardsCursor: null },
    itemsPaginationByTurnId,
  };
}

/** 默认 turns 分页状态（原版 Gge）。 */
export function defaultTurnsPagination(): any {
  return { olderCursor: null, oldestLoadedTurnId: null, isLoadingOlder: false, hasLoadedOldest: true };
}

// ---------------------------------------------------------------------------
// tail 分页加载与合并（原版 jge/Mge/Bg/Nge/Pge/Vg）
// ---------------------------------------------------------------------------

/** 加载完整 tail 历史（原版 jge：页数不限，直到游标耗尽）。 */
export function loadTailTurnsAll(request: TailLoadRequest): Promise<TailLoadResult> {
  return loadTailTurns(request, null);
}

/** 加载单页 tail 历史（原版 Mge）。 */
export function loadTailTurnsSinglePage(request: TailLoadRequest): Promise<TailLoadResult> {
  return loadTailTurns(request, 1);
}

/** tail 加载请求/结果（原版 Bg 的参数与产出）。 */
interface TailLoadRequest {
  conversation: ConversationLike;
  policy: HistoryPolicy;
  olderCursor: string | null;
  oldestLoadedTurnId: string | null;
  fetchPage: (cursor: string | null, limit: number) => Promise<any>;
  getCurrentConversation: () => ConversationLike | null;
}

type TailLoadResult =
  | { status: `stale` }
  | { status: `missing` }
  | {
      status: `loaded`;
      olderTurns: AnyTurn[];
      mergedTurns: AnyTurn[];
      nextCursor: string | null;
      timeline: any;
    };

/** tail 加载核心（原版 Bg）：取页 → 陈旧判定 → 与当前 turns 合并。 */
async function loadTailTurns(request: TailLoadRequest, pageLimit: number | null): Promise<TailLoadResult> {
  let pages = await fetchTurnPages({ ...request, pageLimit });
  if (pages.status === `stale`) return pages;
  let current = request.getCurrentConversation();
  if (current == null) return { status: `missing` };
  if (
    current.turnsPagination?.olderCursor !== request.olderCursor ||
    current.turnsPagination?.source !== request.conversation.turnsPagination?.source
  )
    return { status: `stale` };
  let mergedTurns = buildMergedTailTurns({
    policy: request.policy,
    olderTurns: pages.turns,
    currentTurns: conversationTurns(current),
    oldestLoadedTurnId: request.oldestLoadedTurnId,
  });
  return {
    status: `loaded`,
    olderTurns: pages.turns,
    mergedTurns,
    nextCursor: pages.nextCursor,
    timeline: pages.timeline,
  };
}

/** 合并 tail 页与当前 turns（原版 Nge）：以 oldestLoadedTurnId 为界拼接后
 *  构造完整单岛视图（kge/Age），失败抛错。 */
function buildMergedTailTurns({
  policy,
  olderTurns,
  currentTurns,
  oldestLoadedTurnId,
}: {
  policy: HistoryPolicy;
  olderTurns: AnyTurn[];
  currentTurns: AnyTurn[];
  oldestLoadedTurnId: string | null;
}): AnyTurn[] {
  let boundaryIndex =
    oldestLoadedTurnId == null ? -1 : currentTurns.findIndex((turn) => turn.turnId === oldestLoadedTurnId);
  let mergedTurns = completeHistoryTurns(
    historyFromTurns({
      id: `tail-hydration`,
      entries: (
        boundaryIndex === -1
          ? policy.mergeTurns(olderTurns, currentTurns)
          : policy.mergeTurns(policy.mergeTurns(currentTurns.slice(0, boundaryIndex), olderTurns), currentTurns.slice(boundaryIndex))
      ).map((turn) => ({ turn })),
    }),
  );
  if (mergedTurns == null) throw Error(`Failed to construct complete tail history`);
  return mergedTurns;
}

/** 逐页取回 tail（原版 Pge）：每页 5 条，翻到游标耗尽或达 pageLimit；
 *  期间会话分页状态变化 → stale；游标未前进抛错。 */
async function fetchTurnPages({
  conversation,
  policy,
  olderCursor,
  fetchPage,
  getCurrentConversation,
  pageLimit,
}: TailLoadRequest & { pageLimit: number | null }): Promise<
  { status: `stale` } | { status: `loaded`; turns: AnyTurn[]; timeline: any; nextCursor: string | null }
> {
  let threadParameters = threadTurnParameters(conversation);
  let pages: AnyTurn[][] = [];
  let cursor = olderCursor;
  let timeline: any;
  for (; cursor != null; ) {
    let page = await fetchPage(cursor, 5);
    let pagination = getCurrentConversation()?.turnsPagination;
    if (pagination?.olderCursor !== olderCursor || pagination?.source !== conversation.turnsPagination?.source)
      return { status: `stale` };
    pages.push(
      policy.mapThreadTurns({
        threadId: conversation.id,
        turns: page.response.data.slice().reverse(),
        model: (conversation as any).latestModel,
        reasoningEffort: (conversation as any).latestReasoningEffort,
        cwd: threadParameters.cwd,
        permissions: threadParameters.permissions,
        itemsPaginationByTurnId: page.itemsPaginationByTurnId,
      }),
    );
    if (page.response.nextCursor === cursor)
      throw Error(`Failed to load remaining conversation turns`);
    timeline = page.timeline;
    cursor = page.response.nextCursor;
    if (pageLimit != null && pages.length >= pageLimit) break;
  }
  return { status: `loaded`, turns: pages.reverse().flat(), timeline, nextCursor: cursor };
}

/** 推导线程的 cwd/permissions（原版 Vg）：threadSettings → 末 turn params →
 *  currentPermissions → 默认，逐级回退。 */
export function threadTurnParameters(conversation: ConversationLike): {
  cwd: string;
  permissions: any;
} {
  let lastTurnParams = lastTurn(conversation)?.params;
  let settings = (conversation as any).latestThreadSettings;
  let cwd = settings?.cwd ?? (conversation as any).cwd ?? lastTurnParams?.cwd ?? `/`;
  let defaults = defaultPermissions([cwd]);
  return {
    cwd,
    permissions: {
      approvalPolicy:
        settings?.approvalPolicy ??
        lastTurnParams?.approvalPolicy ??
        (conversation as any).currentPermissions?.approvalPolicy ??
        defaults.approvalPolicy,
      approvalsReviewer:
        settings?.approvalsReviewer ??
        lastTurnParams?.approvalsReviewer ??
        (conversation as any).currentPermissions?.approvalsReviewer ??
        defaults.approvalsReviewer,
      sandboxPolicy:
        settings?.sandboxPolicy ??
        lastTurnParams?.sandboxPolicy ??
        (conversation as any).currentPermissions?.sandboxPolicy ??
        defaults.sandboxPolicy,
    },
  };
}

// ---------------------------------------------------------------------------
// timeline 索引应用（原版 Ug）
// ---------------------------------------------------------------------------

/**
 * 把 timeline 页应用进 conversation 的 itemTimeline/realtimeItems（原版 Ug）。
 * 只对 canonicalVoiceHistory 生效。replace 模式：截到首个新条目为止保留前
 * 缀，未完成的 realtime 条目保留；prepend 模式：去重后前插。realtime
 * item 状态写入 realtimeItems 表。
 */
export function applyTimelinePage(
  conversation: ConversationLike,
  timeline: { data: any[]; nextCursor: string | null; activeRealtimeSessionAtPageStart?: any } | null,
  mode: 'prepend' | 'replace',
): void {
  if (timeline == null || !(conversation as any).canonicalVoiceHistory) return;
  // item 字段裁剪为 {id, type, completed}（timeline 索引只关心存在性）。
  let entries = timeline.data.map((entry) =>
    entry.type === `item`
      ? { ...entry, item: { id: entry.item.id, type: entry.item.type, completed: true } }
      : entry,
  );
  let existingTimeline = (conversation as any).itemTimeline;
  let existingKeys = new Set(existingTimeline?.entries.map(timelineEntryKey));
  let incomingKeys = new Set(entries.map(timelineEntryKey));
  let firstOverlapIndex = existingTimeline?.entries.findIndex((entry: any) => incomingKeys.has(timelineEntryKey(entry))) ?? -1;
  let preservedPrefix =
    mode === `replace` && timeline.nextCursor != null && firstOverlapIndex >= 0
      ? (existingTimeline?.entries.slice(0, firstOverlapIndex) ?? [])
      : [];
  let preservedIncompleteRealtime =
    mode === `replace`
      ? (existingTimeline?.entries.filter(
          (entry: any) =>
            entry.type === `realtime` &&
            (conversation as any).realtimeItems?.[entry.item.id]?.completed === false &&
            !incomingKeys.has(timelineEntryKey(entry)),
        ) ?? [])
      : [];
  (conversation as any).itemTimeline = freezeIdentity({
    activeRealtimeSessionAtPageStart:
      preservedPrefix.length > 0
        ? (existingTimeline?.activeRealtimeSessionAtPageStart ?? null)
        : timeline.activeRealtimeSessionAtPageStart,
    entries:
      mode === `prepend` && existingTimeline != null
        ? [...entries.filter((entry) => !existingKeys.has(timelineEntryKey(entry))), ...existingTimeline.entries]
        : [...preservedPrefix.filter((entry) => !preservedIncompleteRealtime.includes(entry)), ...entries, ...preservedIncompleteRealtime],
  });
  if (mode === `replace`) {
    let previousRealtimeItems = (conversation as any).realtimeItems;
    (conversation as any).realtimeItems = Object.fromEntries(
      [...preservedPrefix, ...preservedIncompleteRealtime].flatMap((entry: any) =>
        entry.type === `realtime` && previousRealtimeItems?.[entry.item.id] != null
          ? [[entry.item.id, previousRealtimeItems[entry.item.id]]]
          : [],
      ),
    );
  }
  let realtimeItems = ((conversation as any).realtimeItems ??= {});
  for (let entry of timeline.data)
    if (entry.type === `realtime` && (mode === `replace` || realtimeItems[entry.item.id] == null))
      realtimeItems[entry.item.id] = freezeIdentity({ item: entry.item, completed: true });
}

// ---------------------------------------------------------------------------
// 边界页恢复（原版 t_/n_/r_/i_）
// ---------------------------------------------------------------------------

/** 边界句柄是否仍与当前拓扑匹配（原版 i_）。 */
function boundaryStillCurrent(history: CanonicalHistory, boundary: BoundaryHandle): boolean {
  let island = history.islands.find(({ id }) => id === boundary.islandId);
  let islandBoundary = boundary.edge === `older` ? island?.olderBoundary : island?.newerBoundary;
  return (
    history.generation === boundary.generation &&
    islandBoundary?.status === `available` &&
    islandBoundary.boundaryId === boundary.boundaryId &&
    islandBoundary.progressKey === boundary.progressKey &&
    islandBoundary.handle.cursor === boundary.handle.cursor &&
    islandBoundary.handle.source === boundary.handle.source
  );
}

/** 边界的下一状态（原版 r_）：游标耗尽 → exhausted；否则带 progressKey。 */
function nextBoundary(
  boundary: BoundaryHandle,
  nextCursor: string | null,
  oldestLoadedTurnId: string | null,
): any {
  return nextCursor == null
    ? { boundaryId: boundary.boundaryId, status: `exhausted` }
    : {
        boundaryId: boundary.boundaryId,
        handle: { source: boundary.handle.source, cursor: nextCursor, oldestLoadedTurnId },
        progressKey: JSON.stringify([nextCursor, oldestLoadedTurnId]),
        status: `available`,
      };
}

/** 为岛内 + 新 entry 建立全局位置映射（原版 n_）：岛之间留
 *  max(5, 新 entry 数)+1 的间隔，新 entry 紧贴应用边排布。 */
function buildPositionMap(
  history: CanonicalHistory,
  boundary: BoundaryHandle,
  entries: HistoryEntry[],
): Map<string, number> {
  let positions = new Map<string, number>();
  let next = 0;
  for (let island of history.islands) {
    for (let entry of island.entries) positions.set(entry.value!, next++);
    next += Math.max(5, entries.length) + 1;
  }
  let island = history.islands.find(({ id }) => id === boundary.islandId);
  let anchorEntry = boundary.edge === `older` ? island?.entries[0] : island?.entries.at(-1);
  let anchorPosition = anchorEntry == null ? 0 : (positions.get(anchorEntry.value!) ?? 0);
  for (let [index, entry] of entries.entries())
    if (!positions.has(entry.value!))
      positions.set(
        entry.value!,
        anchorPosition + (boundary.edge === `older` ? index - entries.length : index + 1),
      );
  return positions;
}

/**
 * 恢复一页 canonical 边界历史（原版 t_）：
 *   1. 边界仍匹配（i_）才发请求（older 用 desc、newer 用 asc）；
 *   2. mapThreadTurns 映射后，在 produce 中以 Ige 应用到拓扑（position
 *      map 由 n_ 构建，identity = turnId）；
 *   3. 应用成功：timeline prepend、写入实体、推进 turnsPagination（compact/
 *      summary/timeline 源时）并广播快照。
 * 返回 'applied' / 'stale'。
 */
export async function restoreHistoryBoundaryPage(
  client: HistoryClient,
  policy: HistoryPolicy,
  threadId: string,
  boundary: BoundaryHandle,
  requestOptions?: any,
  options?: { itemsView?: string; limit?: number },
): Promise<`applied` | `stale`> {
  let conversation = client.getConversation(threadId);
  if (
    conversation?.turnHistory?.kind !== `canonical` ||
    !boundaryStillCurrent((conversation.turnHistory as any).history, boundary)
  )
    return `stale`;
  let source = boundary.handle.source;
  let itemsView = options?.itemsView;
  let page = await client.listThreadTurns(threadId, {
    ...(source === `compact` ? { source } : { source, itemsView }),
    cursor: boundary.handle.cursor,
    limit: options?.limit ?? 5,
    requestOptions,
    sortDirection: boundary.edge === `older` ? `desc` : `asc`,
  });
  if (page.response.nextCursor === boundary.handle.cursor)
    throw Error(`thread/turns/list returned an unchanged cursor`);
  let threadParameters = threadTurnParameters(conversation);
  let mappedTurns = policy.mapThreadTurns({
    threadId,
    turns: boundary.edge === `older` ? page.response.data.slice().reverse() : page.response.data,
    model: (conversation as any).latestModel,
    reasoningEffort: (conversation as any).latestReasoningEffort,
    cwd: threadParameters.cwd,
    permissions: threadParameters.permissions,
    itemsPaginationByTurnId: page.itemsPaginationByTurnId,
  });
  let applied = false;
  client.updateConversationState(
    threadId,
    (draft: any) => {
      if (draft.turnHistory?.kind !== `canonical` || !boundaryStillCurrent(draft.turnHistory.history, boundary))
        return;
      let currentHistory = draft.turnHistory.history;
      let entitiesToWrite: Record<string, AnyTurn> = {};
      let readEntity = (key: string) => entitiesToWrite[key] ?? currentHistory.entitiesByKey[key] ?? null;
      let entries = mappedTurns.map((turn, index) => {
        let key =
          turn.turnId == null
            ? `${boundary.boundaryId}:${boundary.progressKey}:local:${index}`
            : `turn:${turn.turnId}`;
        let existing = readEntity(key);
        entitiesToWrite[key] = {
          ...(existing == null
            ? turn
            : (policy.mergeTurns([existing], [turn], {
                itemMergeMode: source === `timeline` ? `prepend` : `append`,
              })[0] ?? turn)),
        };
        return { key, value: key };
      });
      let oldestLoadedTurnId =
        (itemsView === `summary` || page.source === `compact` || page.source === `timeline`) &&
        boundary.edge === `older`
          ? (mappedTurns.find((turn) => turn.turnId != null)?.turnId ?? boundary.handle.oldestLoadedTurnId)
          : boundary.handle.oldestLoadedTurnId;
      let newerBoundary = nextBoundary(boundary, page.response.nextCursor, oldestLoadedTurnId);
      let positions = buildPositionMap(currentHistory, boundary, entries);
      let result = applyHistoryBoundarySegment(
        currentHistory,
        {
          boundary,
          segment: {
            entries,
            newerBoundary: boundary.edge === `newer` ? newerBoundary : { status: `exhausted` },
            olderBoundary: boundary.edge === `older` ? newerBoundary : { status: `exhausted` },
          },
        },
        {
          getIdentity: (key) => readEntity(key)?.turnId ?? null,
          getPosition: ({ value }) => {
            let position = positions.get(value!);
            if (position == null) throw Error(`Missing history position for ${value}`);
            return position;
          },
          merge: (value) => value,
        },
      );
      if (result.status === `applied`) {
        applyTimelinePage(draft, page.timeline, `prepend`);
        for (let [key, entity] of Object.entries(entitiesToWrite))
          currentHistory.entitiesByKey[key] = freezeIdentity(entity);
        currentHistory.islands = freezeIdentity(result.topology.islands);
        recoverSteeringOrphans(conversationTurns(draft));
        currentHistory.isComplete = page.source !== `compact` && result.topology.isComplete;
        if (
          (itemsView === `summary` || page.source === `compact` || page.source === `timeline`) &&
          boundary.edge === `older`
        )
          draft.turnsPagination = {
            source: page.source ?? (conversation as any).turnsPagination?.source,
            olderCursor: page.response.nextCursor,
            oldestLoadedTurnId,
            isLoadingOlder: false,
            hasLoadedOldest: page.response.nextCursor == null,
          };
        applied = true;
      }
    },
    false,
  );
  if (applied) client.broadcastConversationSnapshot(threadId);
  return applied ? `applied` : `stale`;
}

// ---------------------------------------------------------------------------
// resume 快照合并（原版 j_/Hge）
// ---------------------------------------------------------------------------

/**
 * resume/fork 后把整页快照合并进 conversation（原版 j_）。
 *
 * 步骤：threadStartKind 校正 → listThreadTurns（isCurrent 失效即原样返回）
 * → mapThreadTurns → 计算 turnsPagination（canonical 单岛且尾界 exhausted
 * 时按首匹配 turn 定位插入点 b）→ Cg 合并（isResumeSnapshot +
 * preserveExistingTerminalState）→ 遗留 turn 过滤（compact 源的 inProgress
 * 保留）→ 未合入的 steering-only item 并入相邻 turn → m_ 应用。
 */
export async function mergeResumeTurns(
  client: HistoryClient,
  {
    conversationId,
    cwd,
    isCurrent,
    mapThreadTurns,
    options,
    permissions,
    reasoningEffort,
    threadStartKind,
    turnMergePolicy,
  }: {
    conversationId: string;
    cwd?: string;
    isCurrent: () => boolean;
    mapThreadTurns: (input: any) => AnyTurn[];
    options?: any;
    permissions?: any;
    reasoningEffort?: string | null;
    threadStartKind?: string;
    turnMergePolicy: TurnMergePolicy;
  },
): Promise<any> {
  let conversation = client.getConversation(conversationId);
  let previousTurnsById = new Map(
    conversation == null ? [] : conversationTurns(conversation).map((turn) => [turn.turnId, turn]),
  );
  if (conversation?.threadStartKind !== threadStartKind)
    client.updateConversationState(conversationId, (draft: any) => {
      draft.threadStartKind = threadStartKind;
    });
  let page = await client.listThreadTurns(conversationId, options);
  let current = client.getConversation(conversationId);
  if (!isCurrent() || current == null) return page;
  let mappedTurns = mapThreadTurns({
    threadId: conversationId,
    turns: page.response.data.slice().reverse(),
    model: (current as any).latestModel,
    reasoningEffort: reasoningEffort ?? (current as any).latestReasoningEffort,
    cwd: cwd ?? `/`,
    permissions,
    itemsPaginationByTurnId: page.itemsPaginationByTurnId,
  });
  let firstMappedTurnId = mappedTurns.find((turn) => turn.turnId != null)?.turnId ?? null;
  let mappedTurnIds = new Set(mappedTurns.map((turn) => turn.turnId));
  let currentTurns = conversationTurns(current);
  let { turnHistory, turnsPagination } = current as any;
  // canonical 单岛 + 尾界已尽 + 快照有锚点：插入到现有同 turnId 之前。
  let insertIndex =
    page.response.nextCursor != null &&
    turnsPagination != null &&
    turnsPagination.source === page.source &&
    turnHistory?.kind === `canonical` &&
    turnHistory.history.islands.length === 1 &&
    turnHistory.history.islands[0].newerBoundary.status === `exhausted` &&
    firstMappedTurnId != null
      ? currentTurns.findIndex((turn) => turn.turnId === firstMappedTurnId)
      : -1;
  let nextPagination = {
    source: page.source,
    olderCursor: page.response.nextCursor,
    oldestLoadedTurnId: firstMappedTurnId,
    hasLoadedOldest: page.response.nextCursor == null,
    ...(insertIndex >= 0 ? turnsPagination : void 0),
    isLoadingOlder: false,
  };
  let lastMappedIndex = findLastIndex(currentTurns, (turn) => mappedTurnIds.has(turn.turnId));
  let mergedTurns = [
    ...currentTurns.slice(0, Math.max(0, insertIndex)),
    ...mergeTurnLists(
      currentTurns.filter((turn) => mappedTurnIds.has(turn.turnId)),
      mappedTurns,
      { policy: turnMergePolicy, isResumeSnapshot: true, preserveExistingTerminalState: true },
    ).map((turn) => {
      let previous = previousTurnsById.get(turn.turnId);
      let currentTurn = currentTurns.find((candidate) => candidate.turnId === turn.turnId);
      // 本地 items 与 previous 相同引用的保留本地版本（避免被快照覆盖）。
      let localItemsById = new Map(previous?.items.map((item: any) => [item.id, item]));
      let changedItemsById = new Map(
        currentTurn?.items
          .filter((item: any) => localItemsById.get(item.id) !== item)
          .map((item: any) => [item.id, item]),
      );
      return { ...turn, items: turn.items.map((item: any) => changedItemsById.get(item.id) ?? item) };
    }),
    ...currentTurns.filter(
      (turn, index) =>
        index >= insertIndex &&
        !mappedTurnIds.has(turn.turnId) &&
        (turn.turnId == null ||
          (page.source === `compact` &&
            (turn.status === `inProgress` || previousTurnsById.get(turn.turnId)?.status === `inProgress`)) ||
          (lastMappedIndex === -1 ? !previousTurnsById.has(turn.turnId) : index > lastMappedIndex)),
    ),
  ];
  let mergedTurnIds = new Set(mergedTurns.map((turn) => turn.turnId));
  // 被挤出合并结果的 turn：其 steering-only items 并入最后一个 turn。
  for (let turn of currentTurns) {
    if (mergedTurnIds.has(turn.turnId)) continue;
    let steeringItems = turn.items.filter(isUnboundSteeringMessage);
    if (steeringItems.length === 0) continue;
    let lastTurn = mergedTurns.at(-1);
    if (lastTurn == null)
      mergedTurns.push({
        params: { ...turn.params, input: [] },
        turnId: null,
        turnStartedAtMs: null,
        finalAssistantStartedAtMs: null,
        status: `completed`,
        error: null,
        diff: null,
        items: steeringItems,
      } as AnyTurn);
    else mergedTurns[mergedTurns.length - 1] = { ...lastTurn, items: [...lastTurn.items, ...steeringItems] };
  }
  client.updateConversationState(conversationId, (draft: any) => {
    applyConversationTurns(
      draft,
      produce(mergedTurns, recoverSteeringOrphans),
      nextPagination.hasLoadedOldest && page.source !== `compact`,
      nextPagination.olderCursor == null
        ? void 0
        : {
            cursor: nextPagination.olderCursor,
            oldestLoadedTurnId: nextPagination.oldestLoadedTurnId,
            source: page.source,
          },
      turnMergePolicy,
    );
    draft.turnsPagination = nextPagination;
  });
  return page;
}

/**
 * resume 对账（原版 Hge）：canonical history 必须已就位；以传入 turn 列表
 * 为准重建各岛 entry（同 turnId 换新实体，无 id 的按序顶替），不在列表中
 * 的本地 turn 追加为新的本地实体。
 */
export function reconcileResumeTurns(
  conversation: ConversationLike,
  turns: AnyTurn[],
  createId: () => string,
): void {
  if (conversation.turnHistory?.kind !== `canonical`)
    throw Error(`Cloud history must be canonical before reconciling resume`);
  let history = (conversation.turnHistory as any).history as CanonicalHistory;
  let turnsById = new Map(turns.map((turn) => [turn.turnId, turn]));
  let turnsWithoutId = turns.filter((turn) => turn.turnId == null);
  let remainingTurns = new Set(turns);
  for (let island of history.islands)
    island.entries = island.entries.filter(({ value }) => {
      let existing = history.entitiesByKey[value];
      let replacement = existing.turnId == null ? turnsWithoutId.shift() : turnsById.get(existing.turnId);
      if (replacement == null) {
        delete history.entitiesByKey[value];
        return false;
      }
      history.entitiesByKey[value] = freezeIdentity(replacement);
      remainingTurns.delete(replacement);
      return true;
    });
  for (let turn of remainingTurns) appendLocalTurn(conversation, turn, createId);
}

/** 追加本地 turn 实体（原版 T_/E_）。 */
export function appendLocalTurn(
  conversation: ConversationLike,
  turn: AnyTurn,
  createId: () => string,
): AnyTurn {
  let frozen = freezeIdentity(turn);
  let history = canonicalHistory(conversation);
  if (history != null) {
    let island = exhaustedTailIsland(history);
    if (island == null) {
      // 无尾岛：建一个本地 live 尾岛（两侧 exhausted）。
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

