// 历史读取门面：ConversationHistoryReader（Kge）+ TurnItemsPaginationLoader（Bge）。
//
// 原版 main-C-Mhak1n.ts 31,331-31,566（Bge）、31,982-32,390（Kge）+
// 32,353-32,390（qge/F_/I_/L_ 边界句柄匹配）。
//
// Kge 职责（四个历史源的统一入口 listThreadTurns + 分页/续读状态机）：
//   - timeline（voice/canonical 历史）→ listTimelineTurns；
//   - compact（压缩历史）→ readCompactHistory 回调 + 读缓存去重；
//   - durable 云端 bounded（summary itemsView）→ fetchTurnsWithItems；
//   - durable / paginated host → N_/w_/裸 turns/list 四种分派；
//   - loadConversationTurns：tail 全量装载循环（canonical 边界页恢复优先，
//     legacy 游标分页兜底；loadCompleteHistory 级联重入）；
//   - loadBackgroundThreadHistoryPage：后台（subagent）线程历史按需推进
//     （一次一页，返回 complete/more）。
//
// Bge 职责：单 turn 的 items 分页装载——in-flight 去重（conversationId:
// turnId 键）、preview（summary 首页）并发上限 2 + 排队、canonical
// generation + pagination 引用双重归属校验（ownsLoad）、断线重连游标
// （reconnect）处理、装载后置 opening user message 锚点。

import { $u as normalizeThreadId, _s as DURABLE_HOST_ID } from "@chunk/shared";
import { freezeIdentity, original } from "../vendor/immer";
import {
  applyConversationTurns,
  conversationTurns,
  findDraftTurn,
  findTurnById,
  hasCompleteHistory,
  type AnyTurn,
  type BoundaryHandle,
} from "../turns/canonical-history";
import {
  findAvailableBoundaryHandle,
  matchesTailBoundary,
  tailContainsTurnId,
} from "../turns/history-boundaries";
import {
  applyTimelinePage,
  fetchTurnsWithItems,
  listDurableTurnsWithItems,
  listTimelineTurns,
  listTurnItems,
  loadTailTurnsAll,
  loadTailTurnsSinglePage,
  restoreHistoryBoundaryPage,
  type HistoryClient,
  type HistoryPolicy,
} from "../turns/history-requests";
import { mergeItems } from "../turns/item-merge";
import { recoverTurnSteeringOrphans } from "../turns/steering-merge";

// 从 canonical-history 转发的边界句柄工具（实现在 turns/canonical-history，
// 但语义上属于历史读取域）。
export { findAvailableBoundaryHandle, matchesTailBoundary, tailContainsTurnId };

/** Bge 装载状态（in-flight 去重条目）。 */
interface TurnItemsLoad {
  conversationId: string;
  turnId: string;
  generation: number | null;
  pagination: any;
  cancelled: boolean;
  promise: Promise<void>;
}

/**
 * Turn items 分页装载器（原版 Bge）。
 *
 * ownsLoad 的双重校验：canonical generation 变化（整体重建）或
 * itemsPagination 引用被替换（别的路径改写了该 turn 的分页）都会使当前
 * 装载失效——装载内的每个 await 之后都要复查。
 */
export class TurnItemsPaginationLoader {
  private client: HistoryClient;
  private policy: HistoryPolicy;
  private inFlightLoads = new Map<string, TurnItemsLoad>();
  private queuedPreviews = new Map<TurnItemsLoad, (proceed: boolean) => void>();
  private activePreviewCount = 0;
  private disposed = false;

  constructor(client: HistoryClient, policy: HistoryPolicy) {
    this.client = client;
    this.policy = policy;
  }

  /** 取消在途装载（conversationId 为空时全取消）。 */
  cancelLoads(conversationId?: string | null): void {
    for (let [key, load] of this.inFlightLoads) {
      if (conversationId != null && load.conversationId !== conversationId) continue;
      load.cancelled = true;
      this.queuedPreviews.get(load)?.(false);
      this.queuedPreviews.delete(load);
      if (!this.disposed) this.updateTurnPagination(load, false);
      this.inFlightLoads.delete(key);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.cancelLoads();
  }

  /**
   * 装载「部分 turn 的首页 items」（原版 loadPartialTurnItemsPage）：
   * 找出 itemsPagination.hasLoadedOldest === false 的 turn，取前/后 count
   * 个并发装载。有目标才返回 true。
   */
  async loadPartialTurnItemsPage(
    conversationId: string,
    count: number,
    fromEnd: boolean,
    requestOptions?: any,
  ): Promise<boolean> {
    let conversation = this.client.getConversation(conversationId);
    if (conversation == null) return false;
    let turnIds = conversationTurns(conversation).flatMap((turn) =>
      turn.turnId != null && turn.itemsPagination?.hasLoadedOldest === false ? [turn.turnId] : [],
    );
    let selected = fromEnd ? turnIds.slice(-count) : turnIds.slice(0, count);
    return (
      selected.length !== 0 &&
      (await Promise.all(selected.map((turnId) => this.loadTurnItems(conversationId, turnId, false, requestOptions))), true)
    );
  }

  /**
   * 装载全部剩余 items（原版 loadRemainingTurnItems）：逐个 turn 装到
   * hasLoadedOldest；期间 canonical generation 变化、resumeState 变化
   * （durable bounded 除外）即中止。
   */
  async loadRemainingTurnItems(conversationId: string): Promise<void> {
    let conversation = this.client.getConversation(conversationId);
    let generation =
      conversation?.turnHistory?.kind === `canonical`
        ? (conversation.turnHistory as any).history.generation
        : null;
    for (; !this.disposed; ) {
      let current = this.client.getConversation(conversationId);
      if (
        (current?.turnHistory?.kind === `canonical` ? (current.turnHistory as any).history.generation : null) !==
          generation ||
        ((generation == null || this.client.getHostId() !== DURABLE_HOST_ID || (current as any)?.boundedCloudHistory !== true) &&
          current?.resumeState !== conversation?.resumeState)
      )
        return;
      let nextTurn =
        current == null
          ? null
          : conversationTurns(current).find(
              (turn) => turn.turnId != null && turn.itemsPagination?.hasLoadedOldest === false,
            );
      if (nextTurn?.turnId == null) return;
      await this.loadTurnItems(conversationId, nextTurn.turnId, true);
    }
  }

  /**
   * 装载单个 turn 的 items（原版 loadTurnItems）。已有同键在途装载且仍
   * 归属有效：等待后按需递归续装；归属已失效：取消旧的再开新装载。
   */
  async loadTurnItems(
    conversationId: string,
    turnId: string,
    loadCompleteHistory: boolean,
    requestOptions?: any,
  ): Promise<void> {
    if (this.disposed) return;
    let key = `${conversationId}:${turnId}`;
    let existing = this.inFlightLoads.get(key);
    if (existing != null && this.ownsLoad(existing))
      return (
        await existing.promise,
        loadCompleteHistory && this.ownsLoad(existing)
          ? this.loadTurnItems(conversationId, turnId, true, requestOptions)
          : void 0
      );
    if (existing != null) {
      existing.cancelled = true;
      this.queuedPreviews.get(existing)?.(false);
      this.queuedPreviews.delete(existing);
    }
    let conversation = this.client.getConversation(conversationId);
    let load: TurnItemsLoad = {
      conversationId,
      turnId,
      generation:
        conversation?.turnHistory?.kind === `canonical`
          ? (conversation.turnHistory as any).history.generation
          : null,
      pagination: this.getTurnPagination(conversationId, turnId),
      cancelled: false,
      promise: Promise.resolve(),
    };
    this.inFlightLoads.set(key, load);
    load.promise = this.loadTurnItemsInner(load, loadCompleteHistory, requestOptions);
    try {
      await load.promise;
    } finally {
      if (!this.disposed) this.updateTurnPagination(load, false);
      if (this.inFlightLoads.get(key) === load) this.inFlightLoads.delete(key);
    }
  }

  /** 装载循环（原版 loadTurnItemsInner）：每轮一个 older 游标页。 */
  private async loadTurnItemsInner(
    load: TurnItemsLoad,
    loadCompleteHistory: boolean,
    requestOptions?: any,
  ): Promise<void> {
    let { conversationId, turnId } = load;
    for (; !this.disposed; ) {
      let conversation = this.client.getConversation(conversationId);
      let turn = findTurnById(conversation, turnId, this.policy.turnMergePolicy);
      let itemsPagination = turn?.itemsPagination;
      if (!this.ownsLoad(load) || turn == null || itemsPagination == null || itemsPagination.hasLoadedOldest)
        return;
      let olderCursor = itemsPagination.olderCursor;
      let summaryItemIds = itemsPagination.summaryItemIds;
      let itemsBeforeMerge = new Map(turn.items.map((item: any) => [item.id, item]));
      let isPreviewLoad = !loadCompleteHistory && summaryItemIds != null;
      // preview 并发上限 2：超限时排队等待（被取消则直接返回）。
      if (isPreviewLoad && this.activePreviewCount >= 2) {
        let proceed = await new Promise<boolean>((resolve) => {
          this.queuedPreviews.set(load, resolve);
        });
        if (!proceed) return;
      } else if (isPreviewLoad) this.activePreviewCount++;
      try {
        if (!this.ownsLoad(load)) return;
        this.updateTurnPagination(load, true);
        let items: any[];
        let nextCursor: string | null;
        let reconnectResolved = false;
        do {
          let page = await listTurnItems(
            this.client.sendRequest.bind(this.client),
            conversationId,
            turnId,
            olderCursor,
            requestOptions ??
              (loadCompleteHistory || summaryItemIds != null
                ? { priority: `background`, source: `tail_history` }
                : void 0),
            summaryItemIds == null ? 100 : 98,
          );
          conversation = this.client.getConversation(conversationId);
          turn = findTurnById(conversation, turnId, this.policy.turnMergePolicy);
          if (!this.ownsLoad(load) || turn == null) return;
          items = page.items;
          // 断线重连：app-server 重启后 items 重新快照——装载推进到
          // reconnect.stopItemId 为止，之后从 olderCursorAfterReconnect 继续。
          let stopItemId = turn.itemsPagination?.reconnect?.stopItemId;
          reconnectResolved = stopItemId != null && items.some((item: any) => item.id === stopItemId);
          nextCursor = reconnectResolved
            ? (turn.itemsPagination?.reconnect?.olderCursorAfterReconnect ?? null)
            : page.nextCursor;
        } while (0);
        let orderedItems = items;
        // summary 首载且未到头：探测最老两页（asc），补 opening user message。
        if (
          summaryItemIds != null &&
          nextCursor != null &&
          ((orderedItems = (
            await listTurnItems(
              this.client.sendRequest.bind(this.client),
              conversationId,
              turnId,
              null,
              { priority: `background`, source: `tail_history` },
              2,
              `asc`,
            )
          ).items),
          !this.ownsLoad(load) ||
            ((conversation = this.client.getConversation(conversationId)),
            (turn = findTurnById(conversation, turnId, this.policy.turnMergePolicy)),
            turn == null))
        )
          return;
        let oldestMeaningfulItem = orderedItems.find((item: any) => item.type !== `contextCompaction`);
        let mappedItems = this.policy.mapThreadItems(items);
        let reconnect = turn.itemsPagination?.reconnect;
        // 与快照不同的本地 items（草稿修改过的）优先保留。
        let locallyChangedItems = new Map(
          turn.items
            .filter((item: any) => itemsBeforeMerge.get(item.id) !== item)
            .map((item: any) => [item.id, item]),
        );
        let mergedItems = mergeItems(
          summaryItemIds == null
            ? turn.items
            : turn.items.filter((item: any) => !summaryItemIds.includes(item.id) || locallyChangedItems.has(item.id)),
          mappedItems,
          reconnect == null ? `prepend` : { snapshotBeforeItemId: reconnect.beforeItemId },
        ).map((item: any) => locallyChangedItems.get(item.id) ?? item);
        if (
          (this.client.updateConversationState(
            conversationId,
            (draft: any) => {
              let draftTurn = findDraftTurn(draft, (turn: AnyTurn) => turn.turnId === turnId);
              if (draftTurn?.itemsPagination == null || draftTurn.itemsPagination.olderCursor !== olderCursor)
                return;
              draftTurn.items = freezeIdentity(mergedItems);
              if (summaryItemIds != null && oldestMeaningfulItem?.type === `userMessage`) {
                this.policy.applyOldestUserInput(draftTurn, this.policy.mapThreadItems([oldestMeaningfulItem])[0]);
                draftTurn.itemsPagination.oldestUserInput = oldestMeaningfulItem.content;
                draftTurn.itemsPagination.openingUserMessageId = oldestMeaningfulItem.id;
                draftTurn.itemsPagination.openingUserMessageClientId = oldestMeaningfulItem.clientId;
              }
              let firstMeaningfulMerged = mergedItems.find(
                (item: any) => item != null && item.type !== `contextCompaction`,
              );
              if (
                nextCursor == null &&
                firstMeaningfulMerged?.type === `userMessage` &&
                (draftTurn.itemsPagination.oldestUserInput == null || summaryItemIds != null)
              )
                this.policy.applyOldestUserInput(draftTurn, firstMeaningfulMerged);
              recoverTurnSteeringOrphans(draftTurn);
              draftTurn.itemsPagination = {
                ...draftTurn.itemsPagination,
                summaryItemIds: void 0,
                olderCursor: nextCursor,
                isLoadingOlder: false,
                hasLoadedOldest: nextCursor == null,
                newestSnapshotItemId: draftTurn.itemsPagination.newestSnapshotItemId ?? mappedItems.at(-1)?.id,
                reconnect:
                  nextCursor == null || reconnect == null || reconnectResolved
                    ? void 0
                    : { ...reconnect, beforeItemId: mappedItems[0]?.id ?? reconnect.beforeItemId },
              };
            },
            false,
          ),
          (load.pagination = this.getTurnPagination(conversationId, turnId)),
          this.client.broadcastConversationSnapshot(conversationId),
          !loadCompleteHistory || nextCursor == null)
        )
          return;
      } catch (error) {
        if (!this.ownsLoad(load)) return;
        this.client.logger.warning(`Failed to load older thread items`, {
          safe: { conversationId, turnId },
          sensitive: { error },
        });
        throw error;
      } finally {
        if (isPreviewLoad) {
          let nextQueued = this.queuedPreviews.entries().next().value;
          if (nextQueued == null) this.activePreviewCount--;
          else {
            this.queuedPreviews.delete(nextQueued[0]);
            nextQueued[1](true);
          }
        }
      }
    }
  }

  /** 装载是否仍归属当前状态（原版 ownsLoad）。 */
  private ownsLoad(load: TurnItemsLoad): boolean {
    let { conversationId, turnId } = load;
    let conversation = this.client.getConversation(conversationId);
    let generation =
      conversation?.turnHistory?.kind === `canonical`
        ? (conversation.turnHistory as any).history.generation
        : null;
    return (
      !this.disposed &&
      !load.cancelled &&
      load.generation === generation &&
      this.getTurnPagination(conversationId, turnId) === load.pagination
    );
  }

  private getTurnPagination(conversationId: string, turnId: string): any {
    let conversation = this.client.getConversation(conversationId);
    return conversation == null
      ? void 0
      : conversationTurns(conversation).find((turn) => turn.turnId === turnId)?.itemsPagination;
  }

  private updateTurnPagination(load: TurnItemsLoad, isLoadingOlder: boolean): void {
    let { conversationId, turnId } = load;
    let pagination = this.getTurnPagination(conversationId, turnId);
    if (
      pagination != null &&
      pagination === load.pagination &&
      pagination.isLoadingOlder !== isLoadingOlder
    ) {
      this.client.updateConversationState(conversationId, (draft: any) => {
        let draftTurn = findDraftTurn(draft, (turn: AnyTurn) => turn.turnId === turnId);
        if (draftTurn?.itemsPagination != null) draftTurn.itemsPagination.isLoadingOlder = isLoadingOlder;
      });
      load.pagination = this.getTurnPagination(conversationId, turnId);
    }
  }
}

/** 历史读取的请求选项。 */
export interface ListThreadTurnsOptions {
  source?: string;
  cursor?: string | null;
  limit?: number | null;
  itemLimit?: number;
  itemsView?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  requestOptions?: any;
  useCompactHistory?: boolean;
}

/**
 * 历史读取门面（原版 Kge）。
 *
 * 纯定义区：实例由 R4 manager 装配（client = manager 的请求面，policy =
 * 线程策略聚合，readCompactHistory/beginHistoryPage 可选注入）。
 */
export class ConversationHistoryReader {
  private client: HistoryClient;
  private policy: HistoryPolicy;
  private readCompactHistory:
    | ((request: any, options?: any) => { response: Promise<any>; cancel: () => void })
    | null;
  private beginHistoryPage?: (input: any) => { trace?: any; finish: (result: any) => void; fail: (error: unknown) => void } | null;
  private conversationTurnsLoads = new Map<
    string,
    { promise: Promise<void>; loadCompleteHistory: boolean }
  >();
  private compactHistoryReads = new Map<string | symbol, { response: Promise<any>; cancel: () => void }>();
  private itemPagination: TurnItemsPaginationLoader;
  private backgroundHistoryLoads = new Map<string, Promise<`complete` | `more`>>();

  constructor(
    client: HistoryClient,
    policy: HistoryPolicy,
    readCompactHistory:
      | ((request: any, options?: any) => { response: Promise<any>; cancel: () => void })
      | null,
    beginHistoryPage?: ConversationHistoryReader[`beginHistoryPage`],
  ) {
    this.client = client;
    this.policy = policy;
    this.readCompactHistory = readCompactHistory;
    this.beginHistoryPage = beginHistoryPage;
    this.itemPagination = new TurnItemsPaginationLoader(client, policy);
  }

  cancelItemLoads(conversationId?: string | null): void {
    this.itemPagination.cancelLoads(conversationId);
  }

  resetAfterReconnect(): void {
    this.cancelItemLoads();
    this.backgroundHistoryLoads.clear();
  }

  dispose(): void {
    this.itemPagination.dispose();
    for (let read of this.compactHistoryReads.values()) read.cancel();
    this.compactHistoryReads.clear();
  }

  /** 统一历史读取入口（原版 listThreadTurns）：包 beginHistoryPage trace。 */
  async listThreadTurns(threadId: string, options: ListThreadTurnsOptions = {}): Promise<any> {
    let conversation = this.client.getConversation(normalizeThreadId(threadId));
    let trace = this.beginHistoryPage?.({
      isAeon: conversation?.threadStartKind == null && (conversation as any)?.threadSource == null && void 0,
      source: options.source ?? `ordinary`,
      hasCursor: options.cursor != null,
      trace: options.requestOptions?.trace,
    });
    try {
      let page = await this.readThreadTurnsPage(threadId, {
        ...options,
        requestOptions:
          options.requestOptions == null
            ? void 0
            : { ...options.requestOptions, trace: trace?.trace ?? options.requestOptions.trace },
      });
      trace?.finish(page);
      return page;
    } catch (error) {
      trace?.fail(error);
      throw error;
    }
  }

  /** 四源分派（原版 readThreadTurnsPage）。 */
  private async readThreadTurnsPage(threadId: string, options: ListThreadTurnsOptions): Promise<any> {
    let normalizedThreadId = normalizeThreadId(threadId);
    let conversation = this.client.getConversation(normalizedThreadId);
    let isDurableHost = this.client.getHostId() === DURABLE_HOST_ID;
    if (options.source === `timeline`)
      return listTimelineTurns(this.client, threadId, options.cursor ?? null, options.requestOptions);
    if (options.source === `compact`) throw Error(`Compact history is unsupported for this thread`);
    return isDurableHost &&
      (conversation as any)?.boundedCloudHistory === true &&
      options.itemsView === `summary`
      ? fetchTurnsWithItems(
          this.client,
          (options.itemLimit ?? 100) - 2,
          this.policy.turnMergePolicy,
          threadId,
          options.cursor ?? null,
          null,
          Math.min(options.limit ?? 5, 5),
          options.requestOptions,
          options.sortDirection,
          options.itemsView,
          true,
        )
      : isDurableHost
        ? listDurableTurnsWithItems(
            this.client.sendRequest.bind(this.client),
            threadId,
            options.cursor ?? null,
            options.limit ?? null,
            options.requestOptions,
            options.sortDirection ?? null,
            options.itemsView ?? null,
          ).then((response) => ({ response }))
        : this.client.supportsPaginatedThreadHistory() &&
            (conversation as any)?.historyMode === `paginated` &&
            (conversation as any).paginatedHistory != null
          ? fetchTurnsWithItems(
              this.client,
              this.client.getConversationTurnItemLimit(normalizeThreadId(threadId)),
              this.policy.turnMergePolicy,
              threadId,
              options.cursor ?? null,
              (conversation as any).paginatedHistory.itemsBackwardsCursor,
              options.limit ?? null,
              options.requestOptions,
              options.sortDirection ?? null,
              options.itemsView ?? null,
            )
          : this.client
              .sendRequest(
                `thread/turns/list`,
                {
                  threadId,
                  cursor: options.cursor ?? null,
                  limit: options.limit ?? null,
                  sortDirection: options.sortDirection ?? void 0,
                  itemsView: options.itemsView ?? `full`,
                },
                options.requestOptions,
              )
              .then((response) => ({ response }));
  }

  /** 装载历史边界页（resume 尾界或显式 boundary，原版 loadConversationHistoryBoundaryPage）。 */
  async loadConversationHistoryBoundaryPage(
    threadId: string,
    boundary: BoundaryHandle,
    options: { useCompactHistory?: boolean } = {},
  ): Promise<`applied` | `stale`> {
    let useCompactHistory = options.useCompactHistory === true;
    // aeon（云端 voice）历史源切换未启用：恒为 false（原版 ensureAeonHistorySource）。
    let aeonApplied = await this.ensureAeonHistorySource(threadId, useCompactHistory);
    return aeonApplied
      ? `applied`
      : restoreHistoryBoundaryPage(this.client, this.policy, threadId, boundary);
  }

  /** 装载全部剩余 turns + items（原版 loadRemainingConversationTurns）。 */
  async loadRemainingConversationTurns(threadId: string): Promise<void> {
    await this.loadConversationTurns(threadId, true);
    await this.itemPagination.loadRemainingTurnItems(threadId);
  }

  /** 后台线程历史页（原版 loadBackgroundThreadHistoryPage，去重并发）。 */
  async loadBackgroundThreadHistoryPage(
    threadId: string,
    loadPage: () => Promise<void>,
  ): Promise<`complete` | `more`> {
    let existing = this.backgroundHistoryLoads.get(threadId);
    if (existing != null) return existing;
    let load = this.loadBackgroundThreadHistoryPageInner(threadId, loadPage);
    this.backgroundHistoryLoads.set(threadId, load);
    try {
      return await load;
    } finally {
      if (this.backgroundHistoryLoads.get(threadId) === load) this.backgroundHistoryLoads.delete(threadId);
    }
  }

  private async loadBackgroundThreadHistoryPageInner(
    threadId: string,
    loadPage: () => Promise<void>,
  ): Promise<`complete` | `more`> {
    let conversation = this.client.getConversation(threadId);
    if (conversation != null && hasCompleteHistory(conversation)) return `complete`;
    let requestOptions = { priority: `background`, source: `thread_hydration` };
    let aeonApplied = await this.ensureAeonHistorySource(threadId, false, requestOptions);
    let boundary =
      conversation?.turnHistory?.kind === `canonical`
        ? findAvailableBoundaryHandle((conversation.turnHistory as any).history, true)
        : null;
    let previewLoaded =
      !aeonApplied && (await this.itemPagination.loadPartialTurnItemsPage(threadId, 1, false, requestOptions));
    if (!aeonApplied && !previewLoaded)
      if (boundary == null) {
        if (conversation?.turnsPagination?.olderCursor == null) await loadPage();
        else await this.loadConversationTurns(threadId, false, void 0, requestOptions);
      } else
        await restoreHistoryBoundaryPage(this.client, this.policy, threadId, boundary, requestOptions, {
          itemsView: `full`,
        });
    let updated = this.client.getConversation(threadId);
    if (updated == null) throw Error(`Background task history is unavailable`);
    if (hasCompleteHistory(updated)) return `complete`;
    if (updated === conversation) throw Error(`Background task history did not advance`);
    if (
      !(updated.turnHistory?.kind === `canonical`
        ? findAvailableBoundaryHandle((updated.turnHistory as any).history, true) != null
        : updated.turnsPagination?.olderCursor != null) &&
      !conversationTurns(updated).some((turn) => turn.itemsPagination?.hasLoadedOldest === false)
    )
      throw Error(`Background task history is incomplete without a cursor`);
    return `more`;
  }

  /** 装载剩余 turn items（原版 loadRemainingTurnItems）。 */
  async loadRemainingTurnItems(threadId: string): Promise<void> {
    await this.ensureAeonHistorySource(threadId, false);
    await this.conversationTurnsLoads.get(threadId)?.promise;
    if (this.client.getConversation(threadId)?.turnsPagination?.source === `timeline`)
      await this.loadConversationTurns(threadId, true);
    await this.itemPagination.loadRemainingTurnItems(threadId);
  }

  /** 装载更老一页（原版 loadOlderConversationTurnsPage）。 */
  async loadOlderConversationTurnsPage(
    threadId: string,
    options: { turnId?: string; useCompactHistory?: boolean } = {},
  ): Promise<void> {
    if (options.turnId != null)
      return this.itemPagination.loadTurnItems(threadId, options.turnId, false);
    let useCompactHistory = options.useCompactHistory === true;
    if (await this.ensureAeonHistorySource(threadId, useCompactHistory)) return;
    let conversation = this.client.getConversation(threadId);
    if (
      !(
        conversation?.turnsPagination?.source !== `timeline` &&
        (await this.itemPagination.loadPartialTurnItemsPage(threadId, 1, false))
      )
    )
      await this.loadConversationTurns(
        threadId,
        false,
        (conversation as any)?.boundedCloudHistory === true ? `summary` : void 0,
      );
  }

  /**
   * 装载 turns（原版 loadConversationTurns，去重 + 级联）：
   * 已有在途装载时等待；loadCompleteHistory 且在途的是部分装载时递归补全。
   */
  async loadConversationTurns(
    threadId: string,
    loadCompleteHistory: boolean,
    itemsView?: string | null,
    requestOptions?: any,
  ): Promise<void> {
    if (loadCompleteHistory) await this.ensureAeonHistorySource(threadId, false);
    let existing = this.conversationTurnsLoads.get(threadId);
    if (existing != null)
      return (
        await existing.promise,
        loadCompleteHistory && !existing.loadCompleteHistory
          ? this.loadConversationTurns(threadId, true, itemsView, requestOptions)
          : void 0
      );
    let load = this.loadConversationTurnsInner(threadId, loadCompleteHistory, itemsView, requestOptions);
    this.conversationTurnsLoads.set(threadId, { promise: load, loadCompleteHistory });
    try {
      await load;
    } finally {
      if (this.conversationTurnsLoads.get(threadId)?.promise === load)
        this.conversationTurnsLoads.delete(threadId);
    }
  }

  /** 装载循环（原版 loadConversationTurnsInner）：canonical 先走边界页
   *  恢复，尾界句柄与游标/最老 turn 一致时改走 tail 全量；legacy 走游标
   *  分页。装载成功且（完整模式）游标耗尽才返回。 */
  private async loadConversationTurnsInner(
    threadId: string,
    loadCompleteHistory: boolean,
    itemsView?: string | null,
    requestOptions?: any,
  ): Promise<void> {
    for (;;) {
      let conversation = this.client.getConversation(threadId);
      if (conversation?.turnHistory?.kind === `canonical`) {
        let boundary = findAvailableBoundaryHandle(
          (conversation.turnHistory as any).history,
          loadCompleteHistory,
        );
        if (boundary == null) return;
        if (
          loadCompleteHistory &&
          boundary.handle.source !== `timeline` &&
          matchesTailBoundary((conversation.turnHistory as any).history, boundary) &&
          conversation.turnsPagination?.olderCursor === boundary.handle.cursor &&
          conversation.turnsPagination.oldestLoadedTurnId === boundary.handle.oldestLoadedTurnId &&
          tailContainsTurnId((conversation.turnHistory as any).history, conversation.turnsPagination.oldestLoadedTurnId)
        ) {
          // tail 页与边界页语义重合：走全量 tail 装载（快路径）。
          if ((await this.loadCurrentConversationTurns(threadId, true, boundary, void 0, requestOptions)) === `loaded`)
            return;
          continue;
        }
        if (
          (await restoreHistoryBoundaryPage(
            this.client,
            this.policy,
            threadId,
            boundary,
            requestOptions ?? (loadCompleteHistory ? { priority: `background`, source: `tail_history` } : void 0),
            void 0,
          )) === `applied` &&
          !loadCompleteHistory
        )
          return;
        continue;
      }
      if (
        (await this.loadCurrentConversationTurns(threadId, loadCompleteHistory, void 0, itemsView, requestOptions)) ===
          `loaded` &&
        (!loadCompleteHistory || this.client.getConversation(threadId)?.turnsPagination?.olderCursor == null)
      )
        return;
    }
  }

  /**
   * 一轮 tail 分页装载（原版 loadCurrentConversationTurns）。
   *
   * canonical + 边界句柄：单页（Mge）且成功应用后直接把岛改写为「完整
   * 单岛」（mergedTurns 全量替换 + olderBoundary exhausted + isComplete +
   * 清空 legacy turns）。legacy/无句柄：jge（全量）或 Mge（单页）+ p_
   * 应用。装载前后游标一致性校验，失败回滚 isLoadingOlder。
   */
  private async loadCurrentConversationTurns(
    threadId: string,
    loadCompleteHistory: boolean,
    boundary: BoundaryHandle | null,
    itemsView?: string | null,
    requestOptions?: any,
  ): Promise<`loaded` | `stale`> {
    let conversation = this.client.getConversation(threadId);
    let turnsPagination = conversation?.turnsPagination ?? null;
    let isCompactSource = turnsPagination?.source === `compact`;
    let olderCursor = turnsPagination?.olderCursor ?? null;
    let oldestLoadedTurnId = turnsPagination?.oldestLoadedTurnId ?? null;
    if (conversation == null || olderCursor == null) return `loaded`;
    boundary ??
      this.client.updateConversationState(threadId, (draft: any) => {
        draft.turnsPagination = {
          source: turnsPagination?.source,
          olderCursor,
          oldestLoadedTurnId,
          isLoadingOlder: true,
          hasLoadedOldest: false,
        };
      });
    try {
      let load = await (loadCompleteHistory && turnsPagination?.source !== `timeline`
        ? loadTailTurnsAll
        : loadTailTurnsSinglePage)({
        conversation,
        policy: this.policy,
        olderCursor,
        oldestLoadedTurnId,
        fetchPage: (cursor, limit) => {
          let source = boundary?.handle.source ?? turnsPagination?.source;
          return this.client.listThreadTurns(threadId, {
            cursor,
            limit,
            requestOptions:
              requestOptions ?? (loadCompleteHistory ? { priority: `background`, source: `tail_history` } : void 0),
            sortDirection: boundary == null ? void 0 : `desc`,
            ...(source === `compact` ? { source } : { source, itemsView }),
          });
        },
        getCurrentConversation: () => {
          let current = this.client.getConversation(threadId);
          return boundary == null ||
            (current?.turnHistory?.kind === `canonical` &&
              matchesTailBoundary((current.turnHistory as any).history, boundary))
            ? current
            : null;
        },
      });
      if (load.status === `stale`) return `stale`;
      if (load.status === `missing`) return `loaded`;
      let nextOldestLoadedTurnId =
        load.olderTurns.find((turn) => turn.turnId != null)?.turnId ?? oldestLoadedTurnId;
      let applied = false;
      this.client.updateConversationState(
        threadId,
        (draft: any) => {
          if (
            boundary == null ||
            (draft.turnHistory?.kind === `canonical` && matchesTailBoundary(draft.turnHistory.history, boundary))
          ) {
            if (boundary != null && draft.turnHistory?.kind === `canonical`) {
              // 边界路径：岛整体替换为完整 tail（mergedTurns 已含全部页）。
              let history = draft.turnHistory.history;
              let island = history.islands[0];
              if (island == null) return;
              let entriesByTurnId = new Map<string, any>();
              for (let entry of island.entries) {
                let entity = history.entitiesByKey[entry.value!];
                if (entity != null) entriesByTurnId.set(entity.turnId ?? original(entity) ?? entity, entry);
              }
              island.entries = load.mergedTurns.map((turn, index) => {
                let existingEntry = entriesByTurnId.get(turn.turnId ?? (turn as unknown as string));
                let key =
                  existingEntry?.value ??
                  (turn.turnId == null ? `${island.id}:local:${index}` : `turn:${turn.turnId}`);
                history.entitiesByKey[key] = freezeIdentity(turn);
                return existingEntry ?? { key, value: key };
              });
              island.olderBoundary = {
                boundaryId: island.olderBoundary.boundaryId,
                status: `exhausted`,
              };
              history.isComplete = true;
              draft.turns = [];
            } else
              applyConversationTurns(
                draft,
                load.mergedTurns,
                !isCompactSource && load.nextCursor == null,
                load.nextCursor == null
                  ? void 0
                  : {
                      source: turnsPagination?.source,
                      cursor: load.nextCursor,
                      oldestLoadedTurnId: nextOldestLoadedTurnId,
                    },
                this.policy.turnMergePolicy,
              );
            applyTimelinePage(draft, load.timeline, `prepend`);
            draft.turnsPagination = {
              source: turnsPagination?.source,
              olderCursor: load.nextCursor,
              oldestLoadedTurnId: nextOldestLoadedTurnId,
              isLoadingOlder: false,
              hasLoadedOldest: load.nextCursor == null,
            };
            applied = true;
          }
        },
        false,
      );
      return applied ? (this.client.broadcastConversationSnapshot(threadId), `loaded`) : `stale`;
    } catch (error) {
      let pagination = this.client.getConversation(threadId)?.turnsPagination;
      if (pagination?.olderCursor !== olderCursor || pagination?.source !== turnsPagination?.source)
        return `stale`;
      this.client.logger.warning(`Failed to load older thread turns`, {
        safe: { conversationId: threadId },
        sensitive: { error },
      });
      boundary ??
        this.client.updateConversationState(threadId, (draft: any) => {
          if (draft.turnsPagination?.olderCursor === olderCursor)
            draft.turnsPagination = {
              source: turnsPagination?.source,
              olderCursor,
              oldestLoadedTurnId,
              isLoadingOlder: false,
              hasLoadedOldest: false,
            };
        });
      throw error;
    }
  }

  /**
   * compact 历史读取（原版 readCompactPage）：同请求参数（threadId/cursor/
   * limit/sortDirection 且无 requestOptions）共享一次读，防重复压缩读。
   */
  private async readCompactPage(threadId: string, options: ListThreadTurnsOptions): Promise<any> {
    if (this.readCompactHistory == null)
      throw Error(`Compact history is unsupported by this host`);
    let request = {
      threadId,
      cursor: options.cursor ?? null,
      limit: options.cursor == null ? 5 : 10,
      sortDirection: options.sortDirection ?? `desc`,
    };
    let cacheKey = options.requestOptions == null ? JSON.stringify(request) : Symbol();
    let read = this.compactHistoryReads.get(cacheKey) ?? this.readCompactHistory(request, options.requestOptions);
    this.compactHistoryReads.set(cacheKey, read);
    try {
      let response = await read.response;
      return {
        source: `compact`,
        response,
        itemsPaginationByTurnId: Object.fromEntries(
          response.data.map((turn: any) => [
            turn.id,
            { olderCursor: null, isLoadingOlder: false, hasLoadedOldest: true },
          ]),
        ),
      };
    } finally {
      if (this.compactHistoryReads.get(cacheKey) === read) this.compactHistoryReads.delete(cacheKey);
    }
  }

  /** aeon 历史源切换（原版 ensureAeonHistorySource）：当前恒 false
   *  （保留原版 for(;;) return 结构的语义：直接短路返回）。 */
  private async ensureAeonHistorySource(
    _threadId: string,
    _useCompactHistory: boolean,
    _requestOptions?: any,
  ): Promise<boolean> {
    for (;;) return (this.client.getConversation(_threadId), false);
  }
}

