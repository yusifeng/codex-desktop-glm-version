// ThreadStore：主进程的会话/线程状态存储核心。
//
// 对应 main-C-Mhak1n.ts 34,507-36,469 的 T_e 类（约 90 方法）：
//   - 会话 Map + canonical/legacy 双路径 turn 访问（getSubscribedTurn/
//     getLegacyTurnIdentity/getConversationTurnHistoryTimeline）
//   - thread/turn 字段读取器表（订阅系统按字段名精确通知）
//   - SubscriptionRegistry 分层订阅 + 字段级变更通知（setConversation 的
//     patches/changedItems 逐条分派）
//   - 标题乐观写（pendingThreadTitleWrites 串行 + 失败回滚）
//   - hydration（并发 ≤2、generation 防乱序、durable 分页、archived preview）
//   - 最近会话刷新（routine/expanded/catalog 三模式）与排序键
//   - 子代理后代发现（runtime status evidence 优先级）
//   - transcript 增量（w_e → transcriptChanges）
//
// 依赖：threads/hydration.ts（本轮补齐的 helper 群）、turns/canonical-history、
// threads/timeline-index（g_e）、threads/stream-roles（Xge）。
import {
  $u as threadIdOf,
  $i as errorCodeOfError,
  _s as LONG_LIVED_HOST_ID,
  pa as DEFAULT_THREAD_SOURCE_KINDS,
  Wu as appServerVersionSupports,
} from "@chunk/shared";
import type { Logger } from "@chunk/logger";
import { produce, produceWithPatches } from "../vendor/immer";
import { deepEqual } from "../util/lodash-interop";
import {
  conversationTurns,
  mergedConversationTurns,
  historyTurnCount,
  lastTurn,
  hasCompleteHistory,
  allHistoryEntities,
  listHistorySegments,
  findTurnByTurnId,
  updateTurnIfFound,
  applyConversationTurns,
} from "../turns/canonical-history";
import { listDurableTurnsWithItems } from "../turns/history-requests";
import { ThreadItemIndex } from "./timeline-index";
import { SubscriptionRegistry } from "./stream-roles";
import { AUTOMATION_DETECTOR } from "./automation-detector";
import {
  projectTurns,
  conversationMetaSnapshot,
  metaSnapshotsEqual,
  recentOrderKey,
  hydrateThreadsConcurrent,
  listAllThreadsPaginated,
  conversationListState,
  withThreadMode,
  newConversationFromThread,
  hasCanonicalVoice,
  applyModelSettings,
  upsertRecentConversationState,
  transcriptSnapshot,
  transcriptChanges,
  itemSlots,
  lastActiveTurn,
  RetryLookupCache,
  registerThreadMetadata,
  effectiveRuntimeStatus,
  isDescendantOf,
  parentThreadIdOf,
  isSubagentThread,
  activeAncestryIds,
  isSurfaceableThread,
  historyStateOf,
} from "./hydration";
import {
  cleanThreadTitle,
  threadPreviewTitle,
  threadTimestamps,
  mergedRecencyAt,
  environmentSelection,
  conversationFromThreadSummary,
  subAgentMetadata,
} from "./projection";

// ---------------------------------------------------------------------------
// 局部 helper（原 `Iv`/`E_e`/memoize）
// ---------------------------------------------------------------------------

type HistoryInvalidation = { type: "fullReset" } | { type: "none" } | { type: "entityKeys"; entityKeys: string[]; itemContentOnly?: boolean };

/** patches → 历史失效范围（原 `Iv`）。 */
function historyInvalidationOf(conversation: Record<string, any>, patches: Array<{ path: unknown[] }> | null | undefined): HistoryInvalidation {
  if (patches == null) return { type: "fullReset" };
  const entityKeys = new Set<string>();
  for (const patch of patches) {
    const [root, second, third, key] = patch.path;
    if (root == null) return { type: "fullReset" };
    if (root === "turnHistory") {
      if (second !== "history") return { type: "fullReset" };
      switch (third) {
        case "entitiesByKey":
          if (
            typeof key != "string" ||
            conversation.turnHistory?.kind !== "canonical" ||
            conversation.turnHistory.history.entitiesByKey[key] == null
          )
            return { type: "fullReset" };
          entityKeys.add(key);
          break;
        case "generation":
        case "isComplete":
        case "islands":
          break;
        default:
          return { type: "fullReset" };
      }
    }
  }
  return entityKeys.size === 0 ? { type: "none" } : { type: "entityKeys", entityKeys: [...entityKeys] };
}

/** 最近会话排序（原 `E_e`）。 */
function byRecencyDesc(a: { recencyAt?: number | null; updatedAt: number }, b: { recencyAt?: number | null; updatedAt: number }): number {
  return (b.recencyAt ?? b.updatedAt) - (a.recencyAt ?? a.updatedAt);
}

/** lodash memoize（{max}，原 `pp.default`）。 */
function memoizeMax<T>(fn: (arg: string) => T, { max }: { max: number }) {
  const cache = new Map<string, T>();
  return (arg: string): T => {
    const hit = cache.get(arg);
    if (hit !== undefined) {
      cache.delete(arg);
      cache.set(arg, hit);
      return hit;
    }
    const value = fn(arg);
    cache.set(arg, value);
    if (cache.size > max) cache.delete(cache.keys().next().value as string);
    return value;
  };
}

/** promise memoize：完成后自删（原 readHydrationThreadMemoized 的形态）。 */
function memoizePromise<Key, Args extends unknown[], T>(
  fn: (key: Key, ...args: Args) => Promise<T>,
): ((key: Key, ...args: Args) => Promise<T>) & { delete(key: Key, ...args: Args): void; clear(): void } {
  const cache = new Map<string, Promise<T>>();
  const keyed = (key: Key, ...args: Args): Promise<T> => {
    const cacheKey = JSON.stringify([key, ...args]);
    let promise = cache.get(cacheKey);
    if (promise == null) {
      promise = fn(key, ...args).finally(() => {
        cache.delete(cacheKey);
      });
      cache.set(cacheKey, promise);
    }
    return promise;
  };
  return Object.assign(keyed, {
    delete(key: Key, ...args: Args) {
      cache.delete(JSON.stringify([key, ...args]));
    },
    clear() {
      cache.clear();
    },
  });
}

/** thread_not_found 判定（原 `me` 的最小面，misc/thread-errors 落地后切换）。 */
export function isThreadNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    ((error as Error & { code?: string }).code === "thread_not_found" ||
      /thread_not_found/.test(error.message))
  );
}

// ---------------------------------------------------------------------------
// ThreadStore（原 `T_e`）
// ---------------------------------------------------------------------------

interface ThreadStoreParams {
  hostId: string;
  parseUrl: (url: string) => unknown;
  readQueuedMessages?: (conversationId: string) => unknown;
  getHistoryLimit?: () => number | undefined;
  persistThreadTitle: (request: { threadId: string; name: string }) => Promise<unknown>;
  canBroadcastPatchesToFollowers: (conversationId: string) => boolean;
  isConversationArchiving: (conversationId: string) => boolean;
  host: {
    threadMode: (kind: string) => string;
    threadRecognition: unknown;
    createId: () => string;
    schedule(fn: () => void, ms: number): { dispose(): void };
    removeOpenFileWatches: (conversationId: string) => void;
    readThreadListOriginators?: () => string[] | null;
    workspace: {
      load(force: boolean): Promise<void>;
      getThreadWorkspaceKind(conversationId: string, thread: Record<string, any>): string;
      getThreadWorkspaceBrowserRoot(thread: Record<string, any>): string | null | undefined;
      getThreadProjectlessOutputDirectory(conversationId: string, thread: Record<string, any>): string | null | undefined;
      readThreadListOriginators?: () => string[] | null;
    };
  };
  events: {
    addConversationCallback(conversationId: string, cb: () => void): () => void;
    emitConversation(conversationId: string, conversation: Record<string, any>, invalidation: HistoryInvalidation): void;
    emitAnyConversations(conversations: Record<string, any>[]): void;
    emitAnyConversationMeta(conversations: Record<string, any>[]): void;
    emitConversationPatches(conversationId: string, patches: unknown[], acceptedTranscriptText: unknown): void;
    emitConversationRemoved(conversationId: string): void;
    deleteStreamRoleCallbacks(conversationId: string): void;
    emitThreadSummaries(summaries: Record<string, any>[]): void;
    emitThreadListInvalidated(): void;
  };
  logger: Logger;
  requestClient: {
    sendRequest(method: string, params: unknown, options?: unknown): Promise<any>;
    getCompatibleThreadSortKey(sortKey: string): string;
    supportsPaginatedThreadHistory(): boolean;
  };
  savedReadState: { has(conversationId: string): boolean | undefined };
  onThreadAdded?: (thread: Record<string, any>) => void;
}

type Conversation = Record<string, any>;
type ThreadRecord = Record<string, any>;
type ThreadSummary = Record<string, any>;

export class ThreadStore {
  params: ThreadStoreParams;
  conversations = new Map<string, Conversation>();

  getItemTimelineEntryIndex(conversationId: string, itemId: string) {
    return this.threadItemIndex.timelinePosition(this.conversations.get(conversationId)?.itemTimeline, itemId);
  }

  archiveStateByConversationId = new Map<string, { archived: boolean }>();
  threadsById = new Map<string, ThreadRecord>();
  loadedTurnsByHistory = new WeakMap<object, any[]>();
  timelineByIslands = new WeakMap<object, { generation: number; timeline: unknown[] }>();
  legacyTurnIdentitiesByTurns = new WeakMap<object, { entityKeys: string[]; indicesByEntityKey: Map<string, number> }>();
  turnEntityKeysByConversationId = new Map<string, { islands: unknown; entityKeys: string[] }>();
  threadItemIndex = new ThreadItemIndex({
    parseUrl: (url: string) => this.params.parseUrl(url),
    // getEntityKeys/getTurn 的注入面与原 g_e 构造一致。
    getEntityKeys: (conversation: Conversation) => this.threadFieldReaders.turnEntityKeys(conversation) ?? [],
    getTurn: (conversation: Conversation, entityKey: string) => this.getSubscribedTurn(conversation, entityKey),
  } as never);

  turnFieldReaders = {
    error: (turn: any) => turn?.error ?? null,
    hasOlderItems: (turn: any) => turn?.itemsPagination?.hasLoadedOldest === false,
    hasSubagentActivity: (_turn: any, conversation: Conversation, entityKey: string) =>
      ((this.threadItemIndex as any).activity(conversation)?.[entityKey]?.length ?? 0) > 0,
    interruptedCommandExecutionItemIds: (turn: any) => turn?.interruptedCommandExecutionItemIds ?? null,
    itemIds: (turn: any) => turn?.items.map((item: any) => item?.id) ?? null,
    status: (turn: any) => turn?.status ?? null,
    turnId: (turn: any) => turn?.turnId ?? null,
  };

  threadFieldReaders = {
    mcpServerElicitationRequests: (conversation: Conversation) =>
      conversation?.requests.filter(
        (request: any) => request.method === "mcpServer/elicitation/request" && !("completed" in request && request.completed === true),
      ) ?? null,
    environments: (conversation: Conversation) => conversation?.environments,
    connectedEnvironmentIds: (conversation: Conversation) => conversation?.connectedEnvironmentIds,
    historyComplete: (conversation: Conversation) => (conversation == null ? null : hasCompleteHistory(conversation as never)),
    historyGeneration: (conversation: Conversation) =>
      conversation?.turnHistory?.kind === "canonical" ? conversation.turnHistory.history.generation : null,
    resumeState: (conversation: Conversation) => conversation?.resumeState ?? null,
    boundedCloudHistoryReady: (conversation: Conversation) =>
      conversation?.boundedCloudHistory === true &&
      conversation.turnHistory?.kind === "canonical" &&
      (conversation.turnHistory.history.isComplete || conversation.turnsPagination?.olderCursor != null),
    compactHistoryComplete: (conversation: Conversation) =>
      conversation?.turnsPagination?.source === "compact" ? conversation.turnsPagination.hasLoadedOldest : null,
    listState: (conversation: Conversation, conversationId: string) =>
      conversationListState(
        conversation,
        this.params.hostId,
        this.threadFieldReaders.titleState(conversation, conversationId),
        (this.threadItemIndex as any).status(conversation),
      ),
    queuedMessages: (_conversation: Conversation, conversationId: string | undefined) =>
      conversationId == null ? undefined : this.params.readQueuedMessages?.(conversationId),
    automaticApprovalReviewItems: (conversation: Conversation) =>
      conversation == null
        ? null
        : (mergedConversationTurns(conversation as never, AUTOMATION_DETECTOR as never) as any[]).flatMap((turn) =>
            turn.items.filter((item: any) => item.type === "automaticApprovalReview"),
          ),
    guardianWarnings: (conversation: Conversation) => (conversation == null ? null : conversation.guardianWarnings ?? []),
    createdThreadCalls: (conversation: Conversation) => (this.threadItemIndex as any).createdThreadCalls(conversation),
    subagentActivity: (conversation: Conversation) => (this.threadItemIndex as any).activity(conversation),
    subagentProgress: (conversation: Conversation) => (this.threadItemIndex as any).progress(conversation),
    metadata: (conversation: Conversation) =>
      conversation == null ? null : (this.lastMetaSnapshotById.get(conversation.id) ?? conversationMetaSnapshot(conversation)),
    runtimeStatus: (conversation: Conversation) => (conversation == null ? undefined : conversation.threadRuntimeStatus ?? null),
    collaborationMode: (conversation: Conversation) => conversation?.latestCollaborationMode ?? null,
    modelSettings: (conversation: Conversation) =>
      conversation == null ? null : { model: conversation.latestModel, reasoningEffort: conversation.latestReasoningEffort },
    summary: (_conversation: Conversation, conversationId: string | undefined) =>
      conversationId == null ? null : this.getThreadSummary(conversationId),
    title: (conversation: Conversation) => conversation?.title ?? null,
    titleState: (conversation: Conversation, conversationId: string | undefined = conversation?.id) => {
      if (conversationId != null && this.isConversationSuppressed(conversationId)) return { kind: "archived" };
      const summary = conversationId == null ? null : this.getThreadSummary(conversationId);
      return conversation == null
        ? { kind: "unloaded", summary }
        : { kind: "loaded", title: conversation.title, summary };
    },
    turnEntityKeys: (conversation: Conversation) => {
      if (conversation == null) return null;
      if (conversation.turnHistory?.kind !== "canonical") return this.getLegacyTurnIdentity(conversation).entityKeys;
      const { history } = conversation.turnHistory;
      const cached = this.turnEntityKeysByConversationId.get(conversation.id);
      if (cached?.islands === history.islands) return cached.entityKeys;
      const entityKeys = (this.getConversationTurnHistoryTimeline(history) as any[]).flatMap((entry) =>
        entry.type === "content" ? [entry.value] : [],
      );
      this.turnEntityKeysByConversationId.set(conversation.id, { islands: history.islands, entityKeys });
      return entityKeys;
    },
    timeline: (conversation: Conversation) =>
      conversation?.turnHistory?.kind === "canonical"
        ? this.getConversationTurnHistoryTimeline(conversation.turnHistory.history)
        : null,
    daybreakEnabled: (conversation: Conversation) => conversation?.daybreakEnabled ?? null,
  };

  transcriptAccess = {
    hasSubagentActivity: (conversation: Conversation, entityKey: string) =>
      this.turnFieldReaders.hasSubagentActivity(null, conversation, entityKey),
    turnEntityKeys: (conversation: Conversation) => this.threadFieldReaders.turnEntityKeys(conversation) ?? [],
    timeline: (conversation: Conversation) => this.threadFieldReaders.timeline(conversation),
    turn: (conversation: Conversation, entityKey: string) => this.getSubscribedTurn(conversation, entityKey),
  };

  subscriptions = new SubscriptionRegistry({
    getRecentThreads: () =>
      this.getRecentConversations().map((conversation) =>
        conversationListState(
          conversation,
          this.params.hostId,
          this.threadFieldReaders.titleState(conversation),
          (this.threadItemIndex as any).status(conversation),
        ),
      ),
    getTranscript: (conversationId: string) => this.getTranscript(conversationId),
    getConversation: (conversationId: string) => this.conversations.get(conversationId) ?? null,
    getTurn: (conversation: Conversation, entityKey: string) => this.getSubscribedTurn(conversation, entityKey),
    threadFieldReaders: this.threadFieldReaders,
    turnFieldReaders: this.turnFieldReaders,
  } as never);

  threadReadStates = new Map<string, Promise<any> | Error>();
  backgroundThreadLookups = new RetryLookupCache<any>((error) => isThreadNotFound(error));
  inFlightArchivedThreadIds: Promise<Set<string>> | null = null;
  runtimeThreadStatusEvidenceByThreadId = new Map<string, any>();
  passiveSubagentIndexEnabled = false;
  threadSummaries: ThreadSummary[] = [];
  threadSummariesById = new Map<string, ThreadSummary>();
  recentConversationSortKey = "recency_at";
  fetchedRecentConversations = false;
  recentHistorySource = "live";
  recentConversationIds: string[] = [];
  activeConversationInterests = new Map<string, Set<symbol>>();
  pinnedConversationIds = new Set<string>();
  pendingThreadTitlesById = new Map<string, string>();
  confirmedThreadTitlesById = new Map<string, string>();
  pendingThreadTitleWrites = new Map<string, { hasUnacknowledgedTitle: boolean; lastAcknowledgedTitle: string | null; latestOptimisticWrite: number; promise: Promise<void> }>();
  lastAnySnapshotById = new Map<string, Record<string, unknown>>();
  lastAnyOrderKey: string | null = null;
  lastMetaSnapshotById = new Map<string, Record<string, unknown>>();
  lastMetaOrderKey: string | null = null;
  pendingAnyConversationCallbacks: { any: boolean; meta: boolean } | null = null;
  refreshes = new Map<string, Promise<void>>();
  getCachedDisplayThreadTitle = memoizeMax((name: string) => cleanThreadTitle(name), { max: 500 });
  hydrationGeneration = 0;
  appliedHydrationResults = new WeakSet<object>();
  readHydrationThreadMemoized = memoizePromise(
    (threadId: string, includeTurns: boolean, maxTurns: number | undefined, generation: number) =>
      this.readHydrationThread(threadId, { includeTurns, maxTurns }).finally(() => {
        this.readHydrationThreadMemoized.delete(threadId, includeTurns, maxTurns, generation);
      }),
  );
  pendingCollabThreadReads = new Set<string>();

  constructor(params: ThreadStoreParams) {
    this.params = params;
  }

  // ---- 基础访问 ----

  getConversation(conversationId: string): Conversation | null {
    return this.conversations.get(conversationId) ?? null;
  }

  getRealtimeCallMetadata(conversationId: string) {
    const conversation = this.getConversation(conversationId);
    return conversation == null ? null : { sessionId: conversation.sessionId, threadSource: conversation.threadSource };
  }

  /** 标题生成输入（原 `getConversationTitleInput`）：256KiB 有界读。 */
  getConversationTitleInput(conversationId: string) {
    const conversation = this.getConversation(conversationId);
    if (
      conversation == null ||
      conversation.turnsPagination?.hasLoadedOldest === false ||
      conversation.turnsPagination?.source === "compact"
    )
      return null;
    let firstTurn: any;
    if (conversation.turnHistory?.kind === "canonical") {
      const { history } = conversation.turnHistory;
      if (!history.isComplete || history.islands.length !== 1) return null;
      const firstKey = history.islands[0]?.entries[0]?.value;
      firstTurn = firstKey == null ? undefined : history.entitiesByKey[firstKey];
    } else if (conversation.resumeState === "resumed") firstTurn = conversation.turns[0];
    if (firstTurn == null || (firstTurn.itemsPagination?.hasLoadedOldest === false && firstTurn.itemsPagination.oldestUserInput == null))
      return null;
    const { params } = firstTurn;
    const input = {
      input: params.input,
      clientUserMessageId: params.clientUserMessageId,
      commentAttachments: params.commentAttachments,
    };
    const limit = 262144;
    let budget = limit;
    const budgetError = new Error("Title input exceeds the bounded read limit");
    try {
      return JSON.stringify(input, (_key, value) => {
        if ((budget -= typeof value == "string" ? value.length : 1), budget < 0) throw budgetError;
        return value;
      }).length <= limit
        ? input
        : null;
    } catch (error) {
      if (error === budgetError) return null;
      throw error;
    }
  }

  captureThreadModelSettings(conversationId: string) {
    const conversation = this.conversations.get(conversationId);
    return conversation == null ? null : { model: conversation.latestModel, reasoningEffort: conversation.latestReasoningEffort };
  }

  getTurn(conversationId: string, entityKey: string) {
    return this.getSubscribedTurn(this.conversations.get(conversationId) ?? null, entityKey);
  }

  getLoadedConversationHistoryTurns(history: Record<string, any>) {
    const cached = this.loadedTurnsByHistory.get(history);
    if (cached != null) return cached;
    const turns = allHistoryEntities(history as never);
    this.loadedTurnsByHistory.set(history, turns);
    return turns;
  }

  /** canonical 历史的 timeline（按 islands 代数缓存，原 `getConversationTurnHistoryTimeline`）。 */
  getConversationTurnHistoryTimeline(history: Record<string, any>): unknown[] {
    const cached = this.timelineByIslands.get(history.islands);
    if (cached?.generation === history.generation) return cached.timeline;
    const timeline = listHistorySegments(history as never);
    this.timelineByIslands.set(history.islands, { generation: history.generation, timeline });
    return timeline;
  }

  getSubscribedTurn(conversation: Conversation | null, entityKey: string) {
    if (conversation?.turnHistory?.kind === "canonical") return conversation.turnHistory.history.entitiesByKey[entityKey] ?? null;
    if (conversation == null) return null;
    const index = this.getLegacyTurnIdentity(conversation).indicesByEntityKey.get(entityKey);
    return index == null ? null : (conversation.turns[index] ?? null);
  }

  getLegacyTurnIdentity(conversation: Conversation): { entityKeys: string[]; indicesByEntityKey: Map<string, number> } {
    const cached = this.legacyTurnIdentitiesByTurns.get(conversation.turns);
    if (cached != null) return cached;
    const entityKeys: string[] = conversation.turns.map((turn: any, index: number) => (turn.turnId == null ? `legacy:${index}` : `turn:${turn.turnId}`));
    const identity = { entityKeys, indicesByEntityKey: new Map<string, number>(entityKeys.map((key, index) => [key, index] as [string, number])) };
    this.legacyTurnIdentitiesByTurns.set(conversation.turns, identity);
    return identity;
  }

  getTranscript(conversationId: string) {
    const conversation = this.conversations.get(conversationId);
    return { type: "reset", value: conversation == null ? null : transcriptSnapshot(conversation, this.transcriptAccess as never) };
  }

  subscribe(listener: unknown) {
    return (this.subscriptions as any).subscribe(listener);
  }

  getCachedConversations() {
    return Array.from(this.conversations.values());
  }

  getThreadSummaries() {
    return this.threadSummaries;
  }

  getKnownSubagentDescendantThreads(ancestorId: string) {
    const byId = new Map(this.threadSummaries.map((summary) => [summary.conversationId, summary]));
    for (const thread of this.threadsById.values()) {
      const summary = this.getThreadSummaryFromThread(thread);
      if (!byId.has(summary.conversationId)) byId.set(summary.conversationId, summary);
    }
    return Array.from(byId.values()).flatMap((summary) => {
      if (!isDescendantOf(summary, ancestorId, byId)) return [];
      const thread = this.threadsById.get(summary.conversationId);
      return thread == null ? [] : [thread];
    });
  }

  getThreadCreatedAtMs(conversationId: string) {
    const createdAt = this.conversations.get(conversationId)?.createdAt ?? this.getThreadSummary(conversationId)?.createdAt;
    if (createdAt != null) return createdAt;
    const thread = this.threadsById.get(conversationId);
    return thread == null ? null : thread.createdAt * 1e3;
  }

  captureSubagentDescendantDiscoveryState() {
    return new Map(this.runtimeThreadStatusEvidenceByThreadId);
  }

  /** 子代理后代快照对账（原 `reconcileSubagentDescendantSnapshot`）。 */
  reconcileSubagentDescendantSnapshot(
    ancestorId: string,
    descendantThreads: ThreadRecord[],
    evidence?: Map<string, any> | null,
    { isComplete = true } = {},
  ) {
    this.passiveSubagentIndexEnabled = true;
    const statusUpdates = new Map<string, any>();
    const summariesById = new Map(this.threadSummaries.map((summary) => [summary.conversationId, summary]));
    const activeIds = new Set(descendantThreads.map((thread) => threadIdOf(thread.id)));
    const resolveStatus = (conversationId: string, thread: ThreadRecord | undefined) => {
      const recorded = this.runtimeThreadStatusEvidenceByThreadId.get(conversationId);
      const incoming = evidence?.get(conversationId);
      return recorded != null && (evidence == null || recorded !== incoming)
        ? recorded
        : incoming != null && thread != null && thread.status !== incoming
          ? thread.status
          : undefined;
    };
    const baseline = isComplete ? this.threadSummaries : [];
    for (const summary of baseline) {
      const thread = this.threadsById.get(summary.conversationId);
      const status = resolveStatus(summary.conversationId, thread);
      if (!activeIds.has(summary.conversationId) && isDescendantOf(summary, ancestorId, summariesById)) {
        if (status?.type === "active" || status?.type === "systemError") {
          statusUpdates.set(summary.conversationId, status);
          if (thread != null && thread.status !== status)
            this.threadsById.set(summary.conversationId, { ...thread, status });
          continue;
        }
        this.runtimeThreadStatusEvidenceByThreadId.delete(summary.conversationId);
        statusUpdates.set(summary.conversationId, { type: "idle" });
        summariesById.set(summary.conversationId, { ...summary, threadRuntimeStatus: { type: "idle" } });
        if (thread?.status?.type === "active")
          this.threadsById.set(summary.conversationId, { ...thread, status: { type: "idle" } });
      }
    }
    const updatedThreads = descendantThreads.map((thread) => {
      const conversationId = threadIdOf(thread.id);
      const existing = this.threadsById.get(thread.id);
      const winner = existing != null && threadTimestamps(existing as never).updatedAt > threadTimestamps(thread as never).updatedAt ? existing : thread;
      const status = resolveStatus(conversationId, existing);
      const finalStatus = status == null ? (evidence == null ? winner.status : thread.status) : { ...status };
      if (evidence != null && status != null) this.runtimeThreadStatusEvidenceByThreadId.set(thread.id, finalStatus);
      else this.runtimeThreadStatusEvidenceByThreadId.delete(thread.id);
      const finalThread = status != null || !deepEqual(winner.status, finalStatus) ? { ...winner, status: finalStatus } : winner;
      this.recordThreadAvailability(conversationId);
      this.threadsById.set(finalThread.id, finalThread);
      const summary = this.getThreadSummaryFromThread(finalThread);
      summariesById.set(summary.conversationId, summary);
      statusUpdates.set(summary.conversationId, finalStatus);
      return finalThread;
    });
    const mergedSummaries = Array.from(summariesById.values());
    this.replaceThreadSummaries(mergedSummaries);
    for (const [conversationId, status] of statusUpdates) {
      const conversation = this.conversations.get(conversationId);
      if (conversation != null && !deepEqual(conversation.threadRuntimeStatus, status)) {
        this.updateConversationState(conversationId, (draft) => {
          draft.threadRuntimeStatus = status;
        });
      }
    }
    const ancestry = activeAncestryIds(mergedSummaries, this.getCachedConversations());
    const orphans = mergedSummaries.flatMap((summary) => {
      if (activeIds.has(summary.conversationId) || !isDescendantOf(summary, ancestorId, summariesById)) return [];
      const status =
        this.runtimeThreadStatusEvidenceByThreadId.get(summary.conversationId) ??
        effectiveRuntimeStatus(summary, this.conversations.get(summary.conversationId));
      if (status?.type !== "active" && !ancestry.has(summary.conversationId)) return [];
      const thread = this.threadsById.get(summary.conversationId);
      return thread == null || status == null ? [] : [{ ...thread, status }];
    });
    return [...updatedThreads, ...orphans];
  }

  getThreadRuntimeStatusEvidence(threadId: string) {
    return this.runtimeThreadStatusEvidenceByThreadId.get(threadId);
  }

  /** 记录运行时状态证据（原 `recordThreadRuntimeStatusEvidence`）。 */
  recordThreadRuntimeStatusEvidence(threadId: string, status: any) {
    const conversationId = threadIdOf(threadId);
    this.recordThreadAvailability(conversationId);
    const summary = this.getThreadSummary(conversationId);
    const thread = this.threadsById.get(threadId);
    return (summary != null || thread != null) && !isSubagentThread(summary ?? thread)
      ? (thread != null && this.threadsById.set(threadId, { ...thread, status }),
        this.conversations.has(conversationId)
          ? this.runtimeThreadStatusEvidenceByThreadId.delete(threadId)
          : this.runtimeThreadStatusEvidenceByThreadId.set(threadId, status),
        summary != null &&
          this.replaceThreadSummaries(
            this.threadSummaries.map((entry) => (entry.conversationId === conversationId ? { ...entry, threadRuntimeStatus: status } : entry)),
          ),
        true)
      : (thread != null && this.threadsById.set(threadId, { ...thread, status }),
        this.runtimeThreadStatusEvidenceByThreadId.set(threadId, status),
        this.passiveSubagentIndexEnabled
          ? summary == null
            ? (status.type === "active" &&
                thread != null &&
                isSubagentThread(thread) &&
                this.replaceThreadSummaries([...this.threadSummaries, this.getThreadSummaryFromThread(thread)]),
              !isSubagentThread(thread))
            : (this.replaceThreadSummaries(
                this.threadSummaries.map((entry) => (entry.conversationId === conversationId ? { ...entry, threadRuntimeStatus: status } : entry)),
              ),
              false)
          : true);
  }

  applyThreadDaybreakUpdate(threadId: string, daybreakEnabled: boolean) {
    const thread = this.threadsById.get(threadId);
    if (thread != null && thread.daybreakEnabled !== daybreakEnabled)
      this.threadsById.set(threadId, { ...thread, daybreakEnabled });
    if (this.conversations.has(threadId))
      this.updateConversationState(threadId, (draft) => {
        draft.daybreakEnabled = daybreakEnabled;
      });
    const summary = this.getThreadSummary(threadId);
    if (summary != null && summary.daybreakEnabled !== daybreakEnabled)
      this.replaceThreadSummaries(
        this.threadSummaries.map((entry) => (entry.conversationId === threadId ? { ...entry, daybreakEnabled } : entry)),
      );
  }

  setThreadStartKind(conversationId: string, threadStartKind: string) {
    const conversation = this.conversations.get(conversationId);
    if (conversation != null && conversation.threadStartKind !== threadStartKind)
      this.updateConversationState(conversationId, (draft) => {
        draft.threadStartKind = threadStartKind;
      });
    const summary = this.getThreadSummary(conversationId);
    if (summary != null && summary.threadStartKind !== threadStartKind)
      this.replaceThreadSummaries(
        this.threadSummaries.map((entry) => (entry.conversationId === conversationId ? { ...entry, threadStartKind } : entry)),
      );
  }

  getThreadSummary(conversationId: string): ThreadSummary | null {
    return this.threadSummariesById.get(conversationId) ?? null;
  }

  withThreadMetadata(thread: ThreadRecord) {
    const conversationId = threadIdOf(thread.id);
    return withThreadMode(
      thread,
      this.conversations.get(conversationId)?.threadStartKind ?? this.getThreadSummary(conversationId)?.threadStartKind,
      this.params.host.threadMode(thread.mode),
      this.params.host.threadRecognition,
    );
  }

  applySavedConversationReadState(conversationId: string, hasUnreadTurn: boolean) {
    const summaryChanged = this.setThreadSummaryUnreadState(conversationId, hasUnreadTurn);
    const conversation = this.conversations.get(conversationId);
    const conversationChanged = conversation != null && conversation.hasUnreadTurn !== hasUnreadTurn;
    if (conversationChanged)
      this.updateConversationState(
        conversationId,
        (draft) => {
          draft.hasUnreadTurn = hasUnreadTurn;
          if (!hasUnreadTurn) draft.unreadMessageCount = 0;
        },
        { broadcastPatchesToFollowers: false },
      );
    return summaryChanged || conversationChanged;
  }

  setThreadSummaryUnreadState(conversationId: string, hasUnreadTurn: boolean) {
    const summary = this.getThreadSummary(conversationId);
    return summary == null || summary.hasUnreadTurn === hasUnreadTurn
      ? false
      : (this.replaceThreadSummaries(
          this.threadSummaries.map((entry) => (entry.conversationId === conversationId ? { ...entry, hasUnreadTurn } : entry)),
        ),
        true);
  }

  activateThreadSummary(conversationId: string, { addToRecent = true } = {}) {
    const historyLimit = this.params.getHistoryLimit?.() ?? 50;
    if ((addToRecent && historyLimit <= 50) || this.conversations.has(conversationId)) return;
    const thread = this.threadsById.get(conversationId);
    const summary = this.getThreadSummary(conversationId) ?? (thread == null ? null : this.getThreadSummaryFromThread(thread));
    if (
      summary != null &&
      !this.isConversationSuppressed(conversationId) &&
      this.shouldSurfaceThreadSummary(summary)
    ) {
      this.setConversation(conversationFromThreadSummary(summary as never) as never);
      if (addToRecent) this.ensureRecentConversationId(conversationId);
      this.notifyConversationCallbacks(conversationId, { includeAnyCallbacks: addToRecent });
    }
  }

  removeThreadSummary(conversationId: string) {
    const remaining = this.threadSummaries.filter((summary) => summary.conversationId !== conversationId);
    if (remaining.length !== this.threadSummaries.length) this.replaceThreadSummaries(remaining);
  }

  getRecentConversations() {
    const surfaced: Conversation[] = [];
    for (const conversationId of this.recentConversationIds) {
      const conversation = this.conversations.get(conversationId);
      if (conversation && this.shouldSurfaceRecentConversation(conversation)) surfaced.push(conversation);
    }
    return surfaced.sort((a, b) => {
      switch (this.recentConversationSortKey) {
        case "created_at":
          return b.createdAt - a.createdAt;
        case "updated_at":
          return b.updatedAt - a.updatedAt;
        case "recency_at":
          return (b.recencyAt ?? b.updatedAt) - (a.recencyAt ?? a.updatedAt);
        default:
          return 0;
      }
    });
  }

  get hasFetchedRecentConversations() {
    return this.fetchedRecentConversations;
  }

  get isCatalogHistoryEnabled() {
    return this.recentHistorySource === "catalog";
  }

  getRecentConversationIds() {
    return this.recentConversationIds;
  }

  isConversationActive(conversationId: string) {
    return this.activeConversationInterests.has(conversationId);
  }

  retainActiveConversation(conversationId: string, onActiveChange: (active: boolean) => void) {
    let interests = this.activeConversationInterests.get(conversationId) ?? new Set<symbol>();
    this.activeConversationInterests.set(conversationId, interests);
    const token = Symbol();
    interests.add(token);
    if (interests.size === 1) onActiveChange(true);
    return () => {
      const current = this.activeConversationInterests.get(conversationId);
      if (current === interests && current.delete(token) && current.size === 0) {
        this.activeConversationInterests.delete(conversationId);
        onActiveChange(false);
      }
    };
  }

  removeConversationInterests(conversationId: string) {
    this.activeConversationInterests.delete(conversationId);
  }

  clearActiveConversationInterests() {
    this.activeConversationInterests.clear();
  }

  ensureRecentConversationId(conversationId: string) {
    if (
      this.isEphemeralConversation(conversationId) ||
      this.conversations.get(conversationId)?.sideConversation === true ||
      this.recentConversationIds.includes(conversationId)
    )
      return;
    this.recentConversationIds.unshift(conversationId);
  }

  isEphemeralConversation(conversationId: string) {
    return this.conversations.get(conversationId)?.ephemeral === true || this.threadsById.get(conversationId)?.ephemeral === true;
  }

  getSuppressedArchivedConversationIds() {
    return Array.from(this.archiveStateByConversationId).flatMap(([conversationId, state]) => (state.archived ? [conversationId] : []));
  }

  isConversationSuppressed(conversationId: string) {
    return this.archiveStateByConversationId.get(conversationId)?.archived === true;
  }

  // ---- 核心写入路径 ----

  /** 会话写入 + 字段级通知（原 `setConversation`，patches/changedItems 逐条分派）。 */
  setConversation(
    conversation: Conversation,
    {
      historyInvalidation,
      changedItems,
      patches,
      acceptedTranscriptText,
    }: {
      historyInvalidation?: HistoryInvalidation;
      changedItems?: Array<{ entityKey: string; itemId: string }>;
      patches?: Array<{ op: string; path: unknown[] }>;
      acceptedTranscriptText?: { turnEntityKeys: Iterable<string> };
    } = {},
  ) {
    const previous = this.conversations.get(conversation.id) ?? null;
    const originator = previous == null && conversation.originator == null ? this.getThreadSummary(conversation.id)?.originator : null;
    const next = produce(originator == null ? conversation : { ...conversation, originator }, () => {}) as Conversation;
    // legacy turns 数组未变时复用 identity 缓存（避免重复构建索引）。
    if (
      previous?.turnHistory?.kind !== "canonical" &&
      next.turnHistory?.kind !== "canonical" &&
      previous?.turns.length === next.turns.length &&
      (acceptedTranscriptText == null ||
        [...acceptedTranscriptText.turnEntityKeys].every((entityKey) =>
          this.getLegacyTurnIdentity(previous as never).indicesByEntityKey.has(entityKey),
        )) &&
      (changedItems != null ||
        patches?.every(
          ({ path }) => path[0] !== "turns" || (typeof path[1] == "number" && path.length > 2 && path[2] !== "turnId"),
        ) === true)
    ) {
      const identity = this.legacyTurnIdentitiesByTurns.get(previous!.turns);
      if (identity != null) this.legacyTurnIdentitiesByTurns.set(next.turns, identity);
    }
    (this.threadItemIndex as any).update(previous, next, patches, changedItems);
    this.conversations.set(conversation.id, next);
    if ((this.subscriptions as any).hasConversationSubscribers(conversation.id)) {
      const changes = transcriptChanges(
        { hostId: this.params.hostId, threadId: conversation.id },
        previous,
        next,
        this.transcriptAccess as never,
        patches as never,
        changedItems,
        acceptedTranscriptText as never,
      );
      if (changes != null) (this.subscriptions as any).notifyTranscript(conversation.id, changes);
    }
    if (patches?.length && patches.every(({ path }) => path[0] === "realtimeItems")) return;
    const subscribers = (this.subscriptions as any).get(conversation.id);
    for (const field of ["listState", "titleState"] as const) {
      if (
        subscribers?.get("thread")?.has(field) &&
        !deepEqual(this.threadFieldReaders[field](previous, conversation.id), this.threadFieldReaders[field](next, conversation.id))
      )
        this.notifyThreadField(conversation.id, field);
    }
    if (changedItems != null) {
      for (const field of ["createdThreadCalls", "subagentActivity", "subagentProgress"] as const) {
        if (subscribers?.get("thread")?.has(field) && this.threadFieldReaders[field](previous) !== this.threadFieldReaders[field](next))
          this.notifyThreadField(conversation.id, field);
      }
      const notifiedItems = new Set<string>();
      const notifiedTurns = new Set<string>();
      for (const { entityKey, itemId } of changedItems) {
        if (!notifiedTurns.has(entityKey)) {
          notifiedTurns.add(entityKey);
          const listeners = subscribers?.get(`turn:${entityKey}`)?.get("hasSubagentActivity");
          if (
            listeners != null &&
            this.turnFieldReaders.hasSubagentActivity(null, previous, entityKey) !==
              this.turnFieldReaders.hasSubagentActivity(null, next, entityKey)
          )
            for (const listener of listeners.listeners) listener();
        }
        const itemKey = JSON.stringify([entityKey, itemId]);
        if (!notifiedItems.has(itemKey)) {
          notifiedItems.add(itemKey);
          for (const listener of subscribers?.get(`item:${entityKey}`)?.get(itemId)?.listeners ?? []) listener();
        }
      }
      return;
    }
    const threadSubscribers = subscribers?.get("thread");
    for (const [field, reader] of Object.entries(this.threadFieldReaders) as [string, (conversation: Conversation, id?: string) => unknown][]) {
      if (
        field === "metadata" ||
        field === "listState" ||
        field === "titleState" ||
        field === "summary" ||
        (field === "mcpServerElicitationRequests" && previous?.requests === next.requests) ||
        (field === "guardianWarnings" && previous != null && previous.guardianWarnings === next.guardianWarnings) ||
        !threadSubscribers?.has(field)
      )
        continue;
      const before = reader(previous);
      const after = reader(next);
      if (
        !Object.is(before, after) &&
        ((field !== "runtimeStatus" &&
          field !== "mcpServerElicitationRequests" &&
          field !== "turnEntityKeys" &&
          field !== "modelSettings" &&
          field !== "automaticApprovalReviewItems") ||
          !deepEqual(before, after))
      )
        this.notifyThreadField(conversation.id, field);
    }
    if (subscribers == null) return;
    const turnFieldTargets = new Map<string, Set<string>>();
    if (next.turnHistory?.kind !== "canonical")
      for (const patch of patches ?? []) {
        const [root, index, property] = patch.path;
        if (root !== "turns" || typeof index != "number") continue;
        const turn = next.turns[index] ?? previous?.turns[index];
        const entityKey = turn?.turnId == null ? `legacy:${index}` : `turn:${turn.turnId}`;
        let field: string | null = null;
        if (property === "itemsPagination") field = "hasOlderItems";
        else if (property === "error") field = "error";
        else if (property === "interruptedCommandExecutionItemIds") field = "interruptedCommandExecutionItemIds";
        else if (property === "status") field = "status";
        else if (property === "turnId") field = "turnId";
        else if (property === "items" && patch.path.length <= 4) field = "itemIds";
        if (field == null) continue;
        let fields = turnFieldTargets.get(entityKey);
        fields ?? (fields = new Set(), turnFieldTargets.set(entityKey, fields));
        fields.add(field);
        if (field === "itemIds") fields.add("hasSubagentActivity");
      }
    if ((historyInvalidation as { type?: string } | undefined)?.type !== "none" || turnFieldTargets.size > 0) {
      const entityKeys =
        (historyInvalidation as { type: string; entityKeys?: string[] } | undefined)?.type === "entityKeys"
          ? (historyInvalidation as { entityKeys: string[] }).entityKeys
          : (historyInvalidation as { type: string } | undefined)?.type === "none"
            ? Array.from(turnFieldTargets.keys())
            : Array.from((subscribers as Map<string, unknown>).keys())
                .filter((key) => key.startsWith("turn:"))
                .map((key) => key.slice(5));
      for (const entityKey of entityKeys) {
        const before = this.getSubscribedTurn(previous, entityKey);
        const after = this.getSubscribedTurn(next, entityKey);
        const turnSubscribers = (subscribers as Map<string, Map<string, { listeners: Array<() => void> }>>).get(`turn:${entityKey}`);
        for (const [field, reader] of Object.entries(this.turnFieldReaders) as [string, (turn: any, conversation: Conversation, key: string) => unknown][]) {
          const subscription = turnSubscribers?.get(field);
          if (subscription == null || ((historyInvalidation as { type: string } | undefined)?.type === "none" && !turnFieldTargets.get(entityKey)?.has(field)))
            continue;
          const beforeValue = reader(before, previous, entityKey);
          const afterValue = reader(after, next, entityKey);
          if (!(field === "itemIds" ? deepEqual(beforeValue, afterValue) : Object.is(beforeValue, afterValue)))
            for (const listener of subscription.listeners) listener();
        }
      }
    }
    if (patches == null) {
      for (const [key, itemSubscribers] of subscribers as Map<string, unknown>)
        if (key.startsWith("item:")) this.notifyReplacedTurnItems(key.slice(5), itemSubscribers as never, previous, next);
      return;
    }
    const replacedTurns = new Set<string>();
    const notifiedItems = new Set<string>();
    for (const patch of patches) {
      if (patch.path[0] === "turns") {
        const [, index, property, itemIndex, tail] = patch.path;
        if (typeof index != "number") {
          for (const [key, itemSubscribers] of subscribers as Map<string, unknown>)
            if (key.startsWith("item:")) this.notifyReplacedTurnItems(key.slice(5), itemSubscribers as never, previous, next);
          break;
        }
        const turn = next.turns[index] ?? previous?.turns[index];
        const entityKey = turn?.turnId == null ? `legacy:${index}` : `turn:${turn.turnId}`;
        const itemSubscribers = (subscribers as Map<string, Map<string, { listeners: Array<() => void> }>>).get(`item:${entityKey}`);
        if (itemSubscribers == null || property !== "items") continue;
        if (typeof itemIndex != "number" || tail == null) {
          if (!replacedTurns.has(entityKey)) {
            replacedTurns.add(entityKey);
            this.notifyReplacedTurnItems(entityKey, itemSubscribers as never, previous, next);
          }
          continue;
        }
        const item = turn.items[itemIndex];
        const itemKey = JSON.stringify([entityKey, item?.id]);
        if (item != null && !notifiedItems.has(itemKey)) {
          notifiedItems.add(itemKey);
          for (const listener of itemSubscribers.get(item.id)?.listeners ?? []) listener();
        }
        continue;
      }
      const [root, second, third, entityKey, property, itemIndex, tail] = patch.path;
      if (root !== "turnHistory") continue;
      if (second !== "history" || third !== "entitiesByKey" || typeof entityKey != "string") {
        for (const [key, itemSubscribers] of subscribers as Map<string, unknown>)
          if (key.startsWith("item:")) this.notifyReplacedTurnItems(key.slice(5), itemSubscribers as never, previous, next);
        break;
      }
      const itemSubscribers = (subscribers as Map<string, Map<string, { listeners: Array<() => void> }>>).get(`item:${entityKey}`);
      if (itemSubscribers == null) continue;
      if (property == null || (property === "items" && tail == null)) {
        if (!replacedTurns.has(entityKey)) {
          replacedTurns.add(entityKey);
          this.notifyReplacedTurnItems(entityKey, itemSubscribers as never, previous, next);
        }
        continue;
      }
      if (property !== "items" || typeof itemIndex != "number") continue;
      const item =
        next.turnHistory?.kind === "canonical" ? next.turnHistory.history.entitiesByKey[entityKey]?.items[itemIndex] : undefined;
      if (item == null) continue;
      const itemKey = JSON.stringify([entityKey, item.id]);
      if (!notifiedItems.has(itemKey)) {
        notifiedItems.add(itemKey);
        for (const listener of itemSubscribers.get(item.id)?.listeners ?? []) listener();
      }
    }
  }

  notifyReplacedTurnItems(entityKey: string, itemSubscribers: Map<string, { index: number; listeners: Array<() => void> }>, previous: Conversation | null, next: Conversation) {
    const before = this.getSubscribedTurn(previous, entityKey);
    const after = this.getSubscribedTurn(next, entityKey);
    const indexById = new Map<string, number>((after?.items ?? []).map((item: any, index: number) => [item.id, index] as [string, number]));
    for (const [itemId, subscription] of itemSubscribers) {
      const previousItem = before?.items[subscription.index];
      subscription.index = indexById.get(itemId) ?? -1;
      if (!Object.is(previousItem, after?.items[subscription.index]))
        for (const listener of subscription.listeners) listener();
    }
  }

  // ---- 标题 ----

  /** 乐观标题写（原 `setThreadTitle`）：串行队列 + 失败回滚到最近确认值。 */
  async setThreadTitle(conversationId: string, title: string, options: { onlyIfUntitled?: boolean; expectedTitle?: string; persist?: boolean; requireAcknowledgement?: boolean } = {}) {
    const normalized = normalizeTitle(title);
    if (normalized == null) return false;
    const conversation = this.getConversation(conversationId);
    if (
      (options.onlyIfUntitled && conversation?.title) ||
      (Object.hasOwn(options, "expectedTitle") && conversation?.title !== options.expectedTitle)
    )
      return false;
    if (conversation != null)
      this.updateConversationState(conversationId, (draft) => {
        draft.title = normalized;
      });
    if (options.persist === false) return true;
    const write = this.pendingThreadTitleWrites.get(conversationId) ?? {
      hasUnacknowledgedTitle: false,
      lastAcknowledgedTitle: conversation?.title ?? null,
      latestOptimisticWrite: 0,
      promise: Promise.resolve(),
    };
    let superseded = false;
    const chained = write.promise
      .catch(() => void 0)
      .then(async () => {
        if (
          (options.onlyIfUntitled || Object.hasOwn(options, "expectedTitle")) &&
          this.getConversation(conversationId)?.title !== normalized
        ) {
          superseded = true;
          return;
        }
        write.hasUnacknowledgedTitle = true;
        if (await this.persistThreadTitle(conversationId, normalized, options.requireAcknowledgement === true)) {
          write.hasUnacknowledgedTitle = false;
          write.lastAcknowledgedTitle = normalized;
        }
      });
    write.promise = chained;
    const writeGeneration = ++write.latestOptimisticWrite;
    this.pendingThreadTitleWrites.set(conversationId, write);
    const cleanup = () => {
      if (
        this.pendingThreadTitleWrites.get(conversationId)?.promise === chained &&
        !write.hasUnacknowledgedTitle
      )
        this.pendingThreadTitleWrites.delete(conversationId);
    };
    chained.then(cleanup, cleanup);
    try {
      await chained;
      return !superseded;
    } catch (error) {
      const current = this.getConversation(conversationId);
      if (
        conversation != null &&
        current?.title === normalized &&
        write.latestOptimisticWrite === writeGeneration
      ) {
        this.updateConversationState(conversationId, (draft) => {
          draft.title = write.lastAcknowledgedTitle;
        });
        write.hasUnacknowledgedTitle = false;
        if (write.promise === chained) this.pendingThreadTitleWrites.delete(conversationId);
      }
      throw error;
    }
  }

  async persistThreadTitle(conversationId: string, title: string, requireAcknowledgement: boolean) {
    const request = { threadId: conversationId, name: title };
    try {
      await this.params.persistThreadTitle(request);
      return true;
    } catch (error) {
      let failure = error;
      const message = String((error as Error)?.message ?? error);
      if (message.includes("rollout") && message.includes("is empty")) {
        try {
          await new Promise<void>((resolve) => {
            let unsubscribe: () => void = () => {};
            const timer = this.params.host.schedule(() => {
              unsubscribe();
              resolve();
            }, 500);
            unsubscribe = this.params.events.addConversationCallback(conversationId, () => {
              timer.dispose();
              unsubscribe();
              resolve();
            });
          });
          await this.params.persistThreadTitle(request);
          return true;
        } catch (retryError) {
          failure = retryError;
        }
      }
      this.params.logger.warning("Failed to set thread title", {
        safe: { conversationId },
        sensitive: { error: failure },
      });
      if (requireAcknowledgement) throw failure;
      return false;
    }
  }

  applyThreadTitleUpdate(threadId: string, title: string) {
    const conversationId = threadIdOf(threadId);
    const cleaned = cleanThreadTitle(title) ?? title;
    this.confirmedThreadTitlesById.delete(threadId);
    this.pendingThreadTitlesById.set(threadId, cleaned);
    const thread = this.threadsById.get(threadId);
    if (thread != null) this.threadsById.set(threadId, { ...thread, name: cleaned });
    if (this.conversations.has(conversationId))
      this.updateConversationState(conversationId, (draft) => {
        draft.title = cleaned;
      });
  }

  // ---- 状态更新 ----

  updateConversationState(
    conversationId: string,
    recipe: (draft: Conversation) => void,
    {
      broadcastPatchesToFollowers = true,
      knownHistoryInvalidation,
      knownChangedItems,
      acceptedTranscriptText,
    }: {
      broadcastPatchesToFollowers?: boolean;
      knownHistoryInvalidation?: HistoryInvalidation;
      knownChangedItems?: Array<{ entityKey: string; itemId: string }>;
      acceptedTranscriptText?: { turnEntityKeys: Iterable<string> };
    } = {},
  ) {
    const current = this.conversations.get(conversationId);
    if (!current) {
      this.params.logger.error("Conversation state not found", {
        safe: { conversationId },
        sensitive: {},
      });
      return;
    }
    const broadcast = this.params.canBroadcastPatchesToFollowers(conversationId) && broadcastPatchesToFollowers;
    if (knownHistoryInvalidation != null && !broadcast) {
      const next = produce(current, recipe) as Conversation;
      if (next === current) return;
      this.setConversation(next, {
        historyInvalidation: knownHistoryInvalidation,
        changedItems: knownChangedItems,
        acceptedTranscriptText,
      });
      this.notifyConversationCallbacks(conversationId, {
        historyInvalidation:
          knownChangedItems != null && knownHistoryInvalidation.type === "entityKeys"
            ? { ...knownHistoryInvalidation, itemContentOnly: true }
            : knownHistoryInvalidation,
      });
      return;
    }
    const [next, patches] = produceWithPatches(current, recipe) as unknown as [Conversation, Array<{ op: string; path: unknown[] }>, unknown];
    if (next === current) return;
    const invalidation = historyInvalidationOf(next, patches);
    this.setConversation(next, { historyInvalidation: invalidation, patches, acceptedTranscriptText });
    this.notifyConversationCallbacks(conversationId, { historyInvalidation: invalidation, patches });
    if (broadcast) this.params.events.emitConversationPatches(conversationId, patches, acceptedTranscriptText);
  }

  updateTurnState(
    conversationId: string,
    turnId: string | null,
    mutate: (turn: any) => void,
    { broadcastPatchesToFollowers, findTurnOptions }: { broadcastPatchesToFollowers?: boolean; findTurnOptions?: unknown } = {},
  ) {
    this.updateConversationState(
      conversationId,
      (draft) => {
        updateTurnIfFound(
          draft as never,
          turnId,
          (turn) => {
            if (turn.items == null) turn.items = [];
            if (turn.hookRuns == null) turn.hookRuns = [];
            mutate(turn);
          },
          { logger: this.params.logger, createId: () => this.params.host.createId() } as never,
          findTurnOptions,
        );
      },
      { broadcastPatchesToFollowers },
    );
  }

  suppressArchivedConversation(conversationId: string) {
    const wasSuppressed = this.isConversationSuppressed(conversationId);
    this.archiveStateByConversationId.set(conversationId, { archived: true });
    if (!wasSuppressed) {
      this.notifyThreadField(conversationId, "titleState");
      if (this.conversations.has(conversationId)) this.notifyThreadField(conversationId, "listState");
      this.notifyAnyConversationCallbacks({ forceAny: true });
    }
  }

  unsuppressArchivedConversation(conversationId: string) {
    const wasSuppressed = this.isConversationSuppressed(conversationId);
    this.recordThreadAvailability(conversationId);
    this.archiveStateByConversationId.set(conversationId, { archived: false });
    if (wasSuppressed) {
      this.notifyThreadField(conversationId, "titleState");
      if (this.conversations.has(conversationId)) this.notifyThreadField(conversationId, "listState");
    }
    this.notifyAnyConversationCallbacks({ forceAny: true });
  }

  notifyConversationCallbacks(
    conversationId: string,
    { historyInvalidation, includeAnyCallbacks = true, patches }: { historyInvalidation?: HistoryInvalidation; includeAnyCallbacks?: boolean; patches?: unknown[] } = {},
  ) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      this.params.logger.error("No conversation state for conversation ID", {
        safe: { conversationId },
        sensitive: {},
      });
      return;
    }
    this.params.events.emitConversation(conversationId, conversation, historyInvalidation ?? historyInvalidationOf(conversation, patches as never));
    const snapshot = conversationMetaSnapshot(conversation);
    const lastAny = this.lastAnySnapshotById.get(conversationId);
    const anyChanged = !lastAny || !metaSnapshotsEqual(lastAny, snapshot);
    this.lastAnySnapshotById.set(conversationId, snapshot);
    const lastMeta = this.lastMetaSnapshotById.get(conversationId);
    const metaChanged = !lastMeta || !metaSnapshotsEqual(lastMeta, snapshot);
    this.lastMetaSnapshotById.set(conversationId, snapshot);
    if (metaChanged) this.notifyThreadField(conversationId, "metadata");
    if (!includeAnyCallbacks || (!anyChanged && !metaChanged)) return;
    const pending = this.pendingAnyConversationCallbacks;
    if (pending != null) {
      pending.any ||= anyChanged;
      pending.meta ||= metaChanged;
      return;
    }
    this.notifyAnyConversationCallbacks({ forceAny: anyChanged, forceMeta: metaChanged });
  }

  notifyAnyConversationCallbacks({ forceAny = false, forceMeta = false } = {}) {
    const recent = this.getRecentConversations();
    const orderKey = recentOrderKey(recent as never);
    if (orderKey !== this.lastMetaOrderKey) (this.subscriptions as any).notifyHostField("recentThreads");
    const anyChanged = forceAny || orderKey !== this.lastAnyOrderKey;
    const metaChanged = forceMeta || orderKey !== this.lastMetaOrderKey;
    if (anyChanged) {
      this.lastAnyOrderKey = orderKey;
      this.params.events.emitAnyConversations(recent);
    }
    if (metaChanged) {
      this.lastMetaOrderKey = orderKey;
      this.params.events.emitAnyConversationMeta(recent);
    }
  }

  getSavedReadChanges() {
    const hasUnreadById = new Map(this.threadSummaries.map((summary) => [summary.conversationId, summary.hasUnreadTurn]));
    for (const conversation of this.conversations.values()) hasUnreadById.set(conversation.id, conversation.hasUnreadTurn);
    const changes: Array<{ threadId: string; hasUnreadTurn: boolean }> = [];
    for (const [conversationId, hasUnreadTurn] of hasUnreadById) {
      const saved = this.params.savedReadState.has(conversationId);
      if (saved != null && saved !== hasUnreadTurn) changes.push({ threadId: conversationId, hasUnreadTurn: saved });
    }
    return changes;
  }

  getThreadHasUnreadTurn(conversationId: string) {
    return (
      this.params.savedReadState.has(conversationId) ??
      this.conversations.get(conversationId)?.hasUnreadTurn ??
      this.getThreadSummary(conversationId)?.hasUnreadTurn ??
      false
    );
  }

  removeConversationStoreEntries(conversationId: string) {
    this.conversations.delete(conversationId);
    for (const [scope, fields] of (this.subscriptions as any).get(conversationId) ?? [])
      for (const [field, subscription] of fields)
        if (scope !== "thread" || field !== "summary") for (const listener of subscription.listeners) listener();
    this.threadsById.delete(conversationId);
    this.turnEntityKeysByConversationId.delete(conversationId);
    this.threadReadStates.delete(conversationId);
    this.runtimeThreadStatusEvidenceByThreadId.delete(conversationId);
    this.pendingThreadTitlesById.delete(conversationId);
    this.confirmedThreadTitlesById.delete(conversationId);
    this.pendingThreadTitleWrites.delete(conversationId);
    this.activeConversationInterests.delete(conversationId);
    this.pinnedConversationIds.delete(conversationId);
    this.recentConversationIds = this.recentConversationIds.filter((id) => id !== conversationId);
    this.params.events.emitConversationRemoved(conversationId);
    this.params.events.deleteStreamRoleCallbacks(conversationId);
    this.params.host.removeOpenFileWatches(conversationId);
    this.lastAnySnapshotById.delete(conversationId);
    this.lastMetaSnapshotById.delete(conversationId);
    this.notifyAnyConversationCallbacks();
  }

  notifyThreadField(conversationId: string, field: string) {
    (this.subscriptions as any).notifyThreadField(conversationId, field);
  }

  async refreshRecentConversations({ mode = "routine", sortKey }: { mode?: string; sortKey?: string } = {}) {
    const key = `${mode}:${this.params.requestClient.getCompatibleThreadSortKey(sortKey ?? this.recentConversationSortKey)}`;
    const inFlight = this.refreshes.get(key);
    if (inFlight != null) return inFlight;
    const refresh = Promise.allSettled(this.refreshes.values()).then(() =>
      this.runRecentConversationRefresh(sortKey ?? this.recentConversationSortKey, mode),
    );
    this.refreshes.set(key, refresh);
    try {
      await refresh;
    } finally {
      if (this.refreshes.get(key) === refresh) this.refreshes.delete(key);
    }
  }

  /** catalog 观察到的线程合并（原 `observeCatalogThreads`）：标题冲突消解 + 状态证据。 */
  observeCatalogThreads(threads: ThreadRecord[]) {
    if (threads.length === 0) return;
    const summariesById = new Map(this.threadSummaries.map((summary) => [summary.conversationId, summary]));
    for (const thread of threads) {
      const conversationId = threadIdOf(thread.id);
      const existing = this.threadsById.get(thread.id);
      const conversation = this.conversations.get(conversationId);
      let winner = thread;
      if (existing != null) {
        const existingTitle = this.getCachedDisplayThreadTitle(existing.name);
        const conversationTitle = conversation?.title;
        const existingUpdatedAt = threadTimestamps(existing as { createdAt: number; updatedAt: number; recencyAt?: number | null }).updatedAt;
        const threadUpdatedAt = threadTimestamps(thread as { createdAt: number; updatedAt: number; recencyAt?: number | null }).updatedAt;
        if (
          threadUpdatedAt > existingUpdatedAt &&
          this.getCachedDisplayThreadTitle(thread.name) != null
        ) {
          this.pendingThreadTitlesById.delete(thread.id);
          this.confirmedThreadTitlesById.delete(thread.id);
        }
        if (existingTitle != null && conversationTitle != null && conversationTitle !== existingTitle && existingUpdatedAt >= threadUpdatedAt)
          winner = { ...existing, name: conversationTitle };
        else if (existingUpdatedAt > threadUpdatedAt || (existingUpdatedAt === threadUpdatedAt && this.confirmedThreadTitlesById.get(thread.id) === existingTitle))
          winner = existing;
        if (existingUpdatedAt === threadUpdatedAt && winner !== thread) winner = { ...winner, status: thread.status };
      }
      if (winner.originator == null && thread.originator != null) winner = { ...winner, originator: thread.originator };
      let resolved = this.applyPendingThreadTitle(this.takeRuntimeStatusEvidence(winner));
      if (this.getCachedDisplayThreadTitle(resolved.name) == null && existing != null && this.getCachedDisplayThreadTitle(existing.name) != null) {
        resolved = { ...resolved, name: conversation?.title ?? summariesById.get(conversationId)?.title ?? existing.name };
      }
      this.threadsById.set(resolved.id, resolved);
      const displayTitle = this.getCachedDisplayThreadTitle(resolved.name);
      if (conversation != null)
        this.updateConversationState(conversationId, (draft) => {
          draft.originator = resolved.originator ?? draft.originator;
          Object.assign(draft, environmentSelection(resolved as never, draft, "stored"));
          if (displayTitle != null) draft.title = displayTitle;
          if (draft.resumeState === "needs_resume" && !deepEqual(draft.threadRuntimeStatus, resolved.status))
            draft.threadRuntimeStatus = resolved.status;
        });
      const summary = this.getThreadSummaryFromThread(resolved);
      if (resolved.ephemeral !== true && this.shouldSurfaceThreadSummary(summary)) summariesById.set(summary.conversationId, summary);
      else summariesById.delete(summary.conversationId);
    }
    this.replaceRecentThreadSummaries(Array.from(summariesById.values()).sort(byRecencyDesc as never), 50);
  }

  getCachedThreadMetadata(threadIds: string[]) {
    return threadIds.flatMap((threadId) => {
      const thread = this.threadsById.get(threadId);
      const conversationId = threadIdOf(threadId);
      return thread == null || thread.ephemeral || this.isConversationSuppressed(conversationId)
        ? []
        : [
            {
              ...thread,
              name: this.conversations.get(conversationId)?.title ?? thread.name,
              turns: [],
              preview: "",
              path: null,
              status: { type: "notLoaded" },
            },
          ];
    });
  }

  async hydratePinnedThreads(threadIds: string[], onMissing: (conversationId: string) => void, { throwOnReadError = false } = {}) {
    const unarchived = await this.getUnarchivedThreadIds(threadIds, onMissing, throwOnReadError);
    await this.hydrateThreads(unarchived, {
      addToRecentConversations: true,
      notifyAnyCallbacks: true,
      throwOnReadError,
    });
    return unarchived;
  }

  async hydrateActiveThread(threadId: string) {
    await this.hydrateThreads([threadId], { addToRecentConversations: true, notifyAnyCallbacks: true });
  }

  async hydrateBackgroundThreads(threadIds: string[], { includeTurns = false, maxTurns }: { includeTurns?: boolean; maxTurns?: number } = {}) {
    await this.hydrateThreads(threadIds, {
      addToRecentConversations: false,
      includeTurns,
      maxTurns,
      notifyAnyCallbacks: false,
    });
  }

  async initializeBackgroundThreadHistory(threadId: string, bounded: boolean) {
    await this.hydrateThreads([threadId], {
      addToRecentConversations: false,
      includeTurns: true,
      maxTurns: bounded ? 5 : undefined,
      notifyAnyCallbacks: false,
      retainHistoryPagination: true,
    });
  }

  async hydrateArchivedThreadPreview(conversationId: string, maxTurns: number | undefined) {
    const state = this.archiveStateByConversationId.get(conversationId);
    if (state?.archived === false || (state == null && (this.conversations.has(conversationId) || this.threadsById.has(conversationId))))
      return false;
    if (state == null) this.suppressArchivedConversation(conversationId);
    const marker = this.archiveStateByConversationId.get(conversationId);
    const isCurrent = () => this.archiveStateByConversationId.get(conversationId) === marker;
    const conversation = this.conversations.get(conversationId);
    if (conversation?.turnsPagination != null || (conversation != null && hasCompleteHistory(conversation as never))) return true;
    await this.hydrateThreads([conversationId], {
      addToRecentConversations: false,
      archivedPreview: { isCurrent },
      includeTurns: true,
      maxTurns,
      notifyAnyCallbacks: false,
    });
    if (!isCurrent()) return false;
    if (!this.conversations.has(conversationId)) throw new Error("Could not load archived task");
    return true;
  }

  setPinnedThreadIds(threadIds: string[]) {
    this.pinnedConversationIds = new Set(
      threadIds.map((threadId) => threadIdOf(threadId)).filter((conversationId) => !this.isConversationSuppressed(conversationId)),
    );
    let added = false;
    for (const threadId of threadIds) {
      const conversationId = threadIdOf(threadId);
      if (this.isConversationSuppressed(conversationId)) continue;
      if (this.conversations.has(conversationId) && !this.recentConversationIds.includes(conversationId)) {
        this.ensureRecentConversationId(conversationId);
        added = true;
      }
    }
    if (added) this.notifyAnyConversationCallbacks();
  }

  async listAllThreads({ modelProviders, archived = false, sourceKinds }: { modelProviders: unknown; archived?: boolean; sourceKinds?: unknown }) {
    return listAllThreadsPaginated(
      {
        sendRequest: this.params.requestClient.sendRequest.bind(this.params.requestClient),
        recentConversationsSortKey: this.params.requestClient.getCompatibleThreadSortKey(this.recentConversationSortKey),
        useStateDbOnly: this.params.hostId !== LONG_LIVED_HOST_ID,
      } as never,
      { modelProviders, archived, sourceKinds },
    );
  }

  async listArchivedThreads() {
    return this.listAllThreads({ modelProviders: null, archived: true });
  }

  async searchThreads({ query, limit = 50 }: { query: string; limit?: number }) {
    const searchTerm = query.trim();
    if (searchTerm.length === 0) return [];
    const results: any[] = [];
    const seenCursors = new Set<string | null>();
    let cursor: string | null = null;
    while (results.length < limit) {
      const page = await this.params.requestClient.sendRequest("thread/search", {
        cursor,
        limit: limit - results.length,
        sortKey: this.params.requestClient.getCompatibleThreadSortKey(this.recentConversationSortKey),
        archived: false,
        sourceKinds: DEFAULT_THREAD_SOURCE_KINDS,
        searchTerm,
      });
      results.push(...page.data.filter(({ thread }: any) => isSurfaceableThread(thread)).slice(0, limit - results.length));
      const nextCursor = page.nextCursor;
      if (nextCursor == null || seenCursors.has(nextCursor)) break;
      seenCursors.add(nextCursor);
      cursor = nextCursor;
    }
    return results.map(({ thread, snippet }: any) => {
      const updatedAtMs = (thread.recencyAt ?? thread.updatedAt) * 1e3;
      return {
        hostId: this.params.hostId,
        threadId: thread.id,
        title: this.getSearchResultTitle(thread),
        cwd: thread.cwd,
        updatedAt: Number.isFinite(updatedAtMs) ? updatedAtMs : 0,
        threadSource: thread.threadSource,
        searchPreview: { kind: "contentMatch", snippet },
      };
    });
  }

  getSearchResultTitle(thread: Record<string, any>) {
    return cleanThreadTitle(thread.name) || thread.preview.trim() || thread.cwd.trim() || thread.id;
  }

  resetAfterReconnect() {
    this.hydrationGeneration += 1;
    this.readHydrationThreadMemoized.clear();
    this.threadReadStates.clear();
    this.backgroundThreadLookups.clear();
    this.runtimeThreadStatusEvidenceByThreadId.clear();
    for (const [conversationId, conversation] of this.conversations)
      if (conversation.connectedEnvironmentIds != null || conversation.turnHistory?.kind === "canonical")
        this.updateConversationState(conversationId, (draft) => {
          draft.connectedEnvironmentIds = undefined;
          if (draft.turnHistory?.kind === "canonical") {
            draft.turnHistory.history.generation += 1;
            draft.turnHistory.history.isComplete = false;
          }
        });
  }

  /** thread/read（原 `readThread`）：durable 单飞缓存 + background 退避 + not-found 记忆。 */
  readThread(threadId: string, { includeTurns = false, requestOptions }: { includeTurns?: boolean; requestOptions?: unknown } = {}) {
    const conversationId = threadIdOf(threadId);
    const applyResponse = (response: any) => (
      this.updateConversationState(conversationId, (draft) => {
        Object.assign(draft, environmentSelection(response.thread as never, draft, "stored"));
      }),
      response
    );
    const cached = this.threadReadStates.get(conversationId);
    if (cached instanceof Error) return Promise.reject(cached);
    const params = { threadId, includeTurns };
    if (this.params.hostId !== "durable" && !includeTurns && (requestOptions as { priority?: string } | undefined)?.priority === "background")
      return this.backgroundThreadLookups
        .read(threadId, () => this.params.requestClient.sendRequest("thread/read", params, requestOptions))
        .then(applyResponse);
    this.backgroundThreadLookups.delete(threadId);
    const request =
      requestOptions == null
        ? this.params.requestClient.sendRequest("thread/read", params)
        : this.params.requestClient.sendRequest("thread/read", params, requestOptions);
    if (this.params.hostId !== "durable") return request.then(applyResponse);
    const entry = cached ?? request;
    this.threadReadStates.set(conversationId, entry);
    if (this.threadReadStates.size > 500) {
      const oldest = this.threadReadStates.keys().next().value;
      if (oldest != null) this.threadReadStates.delete(oldest);
    }
    return request.then(
      (response: any) => (this.recordThreadAvailability(conversationId), applyResponse(response)),
      (error: unknown) => {
        throw (
          error instanceof Error &&
            isThreadNotFound(error) &&
            this.threadReadStates.get(conversationId) === entry &&
            this.threadReadStates.set(conversationId, error),
          error
        );
      },
    );
  }

  async hydrateCollabThreads(threadIds: string[]) {
    const pending: string[] = [];
    for (const threadId of threadIds) {
      const conversationId = threadIdOf(threadId);
      if (this.params.isConversationArchiving(conversationId)) continue;
      const thread = this.threadsById.get(threadId);
      if (thread) {
        if (this.conversations.has(conversationId)) continue;
        this.upsertHydratedCollabReceiverConversation(thread, undefined);
        continue;
      }
      if (!this.pendingCollabThreadReads.has(threadId)) pending.push(threadId);
    }
    if (pending.length === 0) return;
    for (const threadId of pending) this.pendingCollabThreadReads.add(threadId);
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(2, pending.length) }, async () => {
        for (;;) {
          const threadId = pending[next];
          next += 1;
          if (threadId == null) return;
          try {
            const modelSettings = this.captureThreadModelSettings(threadIdOf(threadId));
            const response = await this.readThread(threadId, {
              includeTurns: false,
              requestOptions: { priority: "background", source: "collab_hydration" },
            });
            if (this.params.isConversationArchiving(threadIdOf(threadId))) continue;
            this.upsertHydratedCollabReceiverConversation(response.thread, modelSettings);
          } catch (error) {
            this.params.logger.debug("Failed to hydrate collab receiver thread", {
              safe: { threadId },
              sensitive: { error },
            });
          } finally {
            this.pendingCollabThreadReads.delete(threadId);
          }
        }
      }),
    );
  }

  upsertConversationFromThread(thread: ThreadRecord, source: string, modelSettingsAtReadStart?: { model: string; reasoningEffort: unknown } | null) {
    const withMetadata = this.withThreadMetadata(this.applyPendingThreadTitle(thread));
    const conversationId = threadIdOf(withMetadata.id);
    const existing = this.conversations.get(conversationId);
    const resolved =
      source === "live" && withMetadata.daybreakEnabled == null && existing?.daybreakEnabled != null
        ? { ...withMetadata, daybreakEnabled: existing.daybreakEnabled }
        : withMetadata;
    this.registerThreadMetadata(resolved);
    this.ensureRecentConversationId(conversationId);
    const title = cleanThreadTitle(resolved.name);
    const { updatedAt, recencyAt } = threadTimestamps(resolved as { createdAt: number; updatedAt: number; recencyAt?: number | null });
    const gitInfo = resolved.gitInfo;
    const workspaceKind = this.params.host.workspace.getThreadWorkspaceKind(conversationId, resolved);
    const workspaceBrowserRoot = this.params.host.workspace.getThreadWorkspaceBrowserRoot(resolved);
    const projectlessOutputDirectory = this.params.host.workspace.getThreadProjectlessOutputDirectory(conversationId, resolved);
    if (existing) {
      const next = produce(existing, (draft) => {
        Object.assign(draft, environmentSelection(resolved as never, draft, source));
        draft.sessionId = resolved.sessionId;
        draft.ephemeral = resolved.ephemeral;
        draft.rolloutPath = resolved.path || draft.rolloutPath;
        draft.cwd = resolved.cwd || draft.cwd;
        draft.originator = resolved.originator ?? draft.originator;
        draft.source = resolved.source;
        draft.agentNickname = resolved.agentNickname;
        draft.historyMode = resolved.historyMode;
        draft.canonicalVoiceHistory = hasCanonicalVoice(resolved);
        draft.mode = resolved.mode;
        draft.threadStartKind = resolved.threadStartKind;
        draft.threadRuntimeStatus = resolved.status;
        draft.forkedFromId = resolved.forkedFromId == null ? null : threadIdOf(resolved.forkedFromId);
        draft.modelProvider = resolved.modelProvider;
        applyModelSettings(draft, resolved, modelSettingsAtReadStart);
        if (resolved.daybreakEnabled !== undefined) draft.daybreakEnabled = resolved.daybreakEnabled;
        draft.gitInfo = gitInfo ?? draft.gitInfo;
        draft.workspaceKind = workspaceKind;
        draft.workspaceBrowserRoot = workspaceKind === "projectless" ? (workspaceBrowserRoot ?? draft.workspaceBrowserRoot) : null;
        draft.projectlessOutputDirectory = workspaceKind === "projectless" ? (projectlessOutputDirectory ?? draft.projectlessOutputDirectory) : null;
        const currentRecency = draft.recencyAt ?? draft.updatedAt;
        draft.updatedAt = updatedAt;
        draft.recencyAt = mergedRecencyAt({ currentRecencyAt: currentRecency, threadRecencyAt: recencyAt, updatedAt });
        if (!draft.title && title) draft.title = title;
      }) as Conversation;
      this.setConversation(next);
      this.notifyConversationCallbacks(conversationId);
    } else {
      const conversation = newConversationFromThread({
        thread: resolved as never,
        hostId: this.params.hostId,
        conversationId,
        turns: [],
        threadTitle: title,
        resumeState: "needs_resume",
        workspaceKind,
        workspaceBrowserRoot,
        projectlessOutputDirectory,
        hasUnreadTurn: this.getThreadHasUnreadTurn(conversationId),
        latestCollaborationMode: {
          mode: "default",
          settings: { model: "", reasoning_effort: null, developer_instructions: null },
        },
      });
      Object.assign(conversation, environmentSelection(resolved as never, conversation, source));
      this.setConversation(conversation);
      this.notifyConversationCallbacks(conversationId);
      this.params.onThreadAdded?.(resolved);
    }
    return conversationId;
  }

  getConcurrentArchivedThreadIds() {
    if (this.inFlightArchivedThreadIds != null) return this.inFlightArchivedThreadIds;
    const request = this.listArchivedThreads()
      .then((threads) => new Set((threads as any[]).map((thread) => thread.id)))
      .finally(() => {
        if (this.inFlightArchivedThreadIds === request) this.inFlightArchivedThreadIds = null;
      });
    this.inFlightArchivedThreadIds = request;
    return request;
  }

  async getUnarchivedThreadIds(threadIds: string[], onMissing: (conversationId: string) => void, throwOnReadError: boolean) {
    if (threadIds.length === 0) return [];
    let archivedIds: Set<string>;
    try {
      archivedIds = await this.getConcurrentArchivedThreadIds();
    } catch (error) {
      if (throwOnReadError) throw error;
      this.params.logger.warning("Failed to filter archived hydrated threads", {
        safe: {},
        sensitive: { error },
      });
      return threadIds;
    }
    return threadIds.filter((threadId) => {
      if (!archivedIds.has(threadId)) return true;
      const conversationId = threadIdOf(threadId);
      const state = this.archiveStateByConversationId.get(conversationId);
      return state == null ? (onMissing(conversationId), false) : !state.archived;
    });
  }

  async runRecentConversationRefresh(sortKey: string, mode: string) {
    if (mode === "catalog") {
      this.recentHistorySource = "catalog";
      this.replaceRecentThreadSummaries([]);
      this.recentConversationIds = this.recentConversationIds.filter((conversationId) => {
        const conversation = this.conversations.get(conversationId);
        return (
          this.isConversationActive(conversationId) ||
          this.pinnedConversationIds.has(conversationId) ||
          conversation?.hasUnreadTurn === true ||
          (conversation?.requests.length ?? 0) > 0 ||
          conversation?.threadRuntimeStatus?.type === "active" ||
          conversation?.turns.at(-1)?.status === "inProgress"
        );
      });
      this.notifyAnyConversationCallbacks();
      return;
    }
    if (this.recentHistorySource !== "live" && mode === "routine") return;
    this.recentHistorySource = "live";
    this.params.events.emitThreadListInvalidated();
    await this.loadThreadHydrationState();
    const sortKeyChanged = sortKey !== this.recentConversationSortKey;
    this.recentConversationSortKey = sortKey;
    const historyLimit = this.params.getHistoryLimit?.() ?? 50;
    if (historyLimit === 0) {
      this.recentHistorySource = "disabled";
      return;
    }
    const expanded = (mode === "expanded" || sortKeyChanged) && historyLimit > 50;
    const targetCount = expanded ? historyLimit : 50;
    const originators = this.params.host.workspace.readThreadListOriginators?.();
    let page = await this.listRecentThreads({
      originators,
      limit: expanded ? Math.min(targetCount, 100) : targetCount,
      cursor: null,
      background: expanded,
    });
    if (page.data.length < targetCount && page.nextCursor != null) {
      const data = [...page.data];
      const seenCursors = new Set<string>();
      let cursor = page.nextCursor;
      while (data.length < targetCount && cursor != null && !seenCursors.has(cursor)) {
        seenCursors.add(cursor);
        const next = await this.listRecentThreads({
          originators,
          limit: Math.min(targetCount - data.length, 100),
          cursor,
          background: expanded,
        });
        data.push(...next.data.slice(0, targetCount - data.length));
        cursor = next.nextCursor;
      }
      page = { ...page, data, nextCursor: cursor };
    }
    this.fetchedRecentConversations = true;
    let threads = page.data;
    if (expanded) {
      const surfacedThreads: ThreadRecord[] = [];
      const surfacedSummaries: ThreadSummary[] = [];
      for (const thread of threads) {
        const existing = this.threadsById.get(thread.id);
        const winner = existing != null && threadTimestamps(existing as never).updatedAt > threadTimestamps(thread as never).updatedAt ? existing : thread;
        this.recordThreadAvailability(threadIdOf(thread.id));
        this.threadsById.set(thread.id, winner);
        const summary = this.getThreadSummaryFromThread(winner);
        if (this.shouldSurfaceThreadSummary(summary)) {
          surfacedThreads.push(winner);
          surfacedSummaries.push(summary);
        }
      }
      this.replaceRecentThreadSummaries(surfacedSummaries);
      threads = surfacedThreads.slice(0, 50);
    } else if (historyLimit > 50 && this.threadSummaries.length > 0) {
      this.mergeRecentThreadSummaries(threads, historyLimit, page.nextCursor != null);
    }
    const previousRecentIds = this.recentConversationIds;
    this.recentConversationIds = [];
    const keptIds = new Set<string>();
    for (const thread of threads) {
      const conversationId = threadIdOf(thread.id);
      if (!keptIds.has(conversationId)) {
        keptIds.add(conversationId);
        this.recentConversationIds.push(conversationId);
      }
    }
    this.pendingAnyConversationCallbacks = { any: false, meta: false };
    const pendingCallbacks = this.pendingAnyConversationCallbacks;
    try {
      for (const thread of threads) {
        const conversationId = threadIdOf(thread.id);
        const isNew = !this.conversations.has(conversationId);
        this.upsertRecentConversationState(conversationId, thread);
        if (isNew) this.notifyConversationCallbacks(conversationId);
      }
      if (historyLimit <= 50 && this.threadSummaries.length > 0) this.replaceRecentThreadSummaries([]);
    } finally {
      this.pendingAnyConversationCallbacks = null;
    }
    const retained: string[] = [];
    for (const conversationId of previousRecentIds) {
      if (keptIds.has(conversationId)) continue;
      const conversation = this.conversations.get(conversationId);
      if (
        conversation &&
        conversation.ephemeral !== true &&
        (conversation.resumeState === "resumed" || this.pinnedConversationIds.has(conversationId) || this.isConversationActive(conversationId))
      ) {
        keptIds.add(conversationId);
        retained.push(conversationId);
      }
    }
    if (retained.length > 0) this.recentConversationIds = [...retained, ...this.recentConversationIds];
    this.notifyAnyConversationCallbacks({ forceAny: pendingCallbacks.any, forceMeta: pendingCallbacks.meta });
  }

  async listRecentThreads({ originators, cursor, limit, background = false }: { originators?: string[] | null; cursor: string | null; limit: number; background?: boolean }) {
    const params = {
      limit,
      cursor,
      sortKey: this.params.requestClient.getCompatibleThreadSortKey(this.recentConversationSortKey),
      modelProviders: null,
      archived: false,
      originators,
      sourceKinds: DEFAULT_THREAD_SOURCE_KINDS,
      useStateDbOnly: this.params.hostId !== LONG_LIVED_HOST_ID,
    };
    const page = await this.params.requestClient.sendRequest(
      "thread/list",
      params,
      background ? { priority: "background", source: "recent_threads" } : { source: "recent_threads" },
    );
    return { ...page, data: page.data.filter((thread: any) => isSurfaceableThread(thread)) };
  }

  /** 批量 hydration（原 `hydrateThreads`）：并发 ≤2 + generation 防乱序 + 结果去重。 */
  async hydrateThreads(
    threadIds: string[],
    {
      addToRecentConversations,
      archivedPreview,
      includeTurns = false,
      maxTurns,
      notifyAnyCallbacks,
      retainHistoryPagination = false,
      throwOnReadError = retainHistoryPagination,
    }: {
      addToRecentConversations?: boolean;
      archivedPreview?: { isCurrent(): boolean };
      includeTurns?: boolean;
      maxTurns?: number;
      notifyAnyCallbacks?: boolean;
      retainHistoryPagination?: boolean;
      throwOnReadError?: boolean;
    },
  ) {
    const generation = this.hydrationGeneration;
    await this.loadThreadHydrationState();
    const knownTurnIdsByConversation = new Map<string, Set<string>>();
    if (includeTurns)
      for (const threadId of threadIds) {
        const conversationId = threadIdOf(threadId);
        const conversation = this.conversations.get(conversationId);
        knownTurnIdsByConversation.set(
          conversationId,
          new Set(
            conversation == null
              ? []
              : (mergedConversationTurns(conversation as never, AUTOMATION_DETECTOR as never) as any[]).flatMap((turn) =>
                  turn.turnId == null ? [] : [turn.turnId],
                ),
          ),
        );
      }
    await hydrateThreadsConcurrent({
      logger: this.params.logger as never,
      threadIds: threadIds.filter(
        (threadId) => !threadId.includes(":") && !(this.threadReadStates.get(threadIdOf(threadId)) instanceof Error),
      ),
      recentConversationIds: this.recentConversationIds,
      conversations: this.conversations as never,
      isConversationSuppressed: this.isConversationSuppressed.bind(this),
      addToRecentConversations,
      includeArchived: archivedPreview != null,
      includeTurns,
      maxTurns,
      throwOnReadError,
      notifyAnyCallbacks,
      shouldApplyHydratedThread: () => generation === this.hydrationGeneration && (archivedPreview?.isCurrent() ?? true),
      shouldAddThreadToRecentConversations: (thread) => !isSubagentThread(thread) && isSurfaceableThread(thread),
      readThread: (threadId, options) =>
        archivedPreview == null && !retainHistoryPagination
          ? this.readHydrationThreadMemoized(threadId, options.includeTurns ?? false, options.maxTurns, generation)
          : this.readHydrationThread(threadId, {
              ...options,
              requestOptions: retainHistoryPagination
                ? { priority: "background", source: "thread_hydration" }
                : { source: "thread_hydration" },
            }),
      upsertHydratedConversationState: (conversationId, result) => {
        if (this.appliedHydrationResults.has(result)) return;
        this.appliedHydrationResults.add(result);
        const { response } = result;
        const existingThread = this.threadsById.get(conversationId);
        const stale =
          existingThread != null &&
          (existingThread.updatedAt > response.thread.updatedAt ||
            (existingThread.updatedAt === response.thread.updatedAt &&
              !deepEqual(existingThread.status, result.threadStatusAtReadStart) &&
              !deepEqual(existingThread.status, response.thread.status)));
        if (stale && !retainHistoryPagination) {
          if (!includeTurns && !this.conversations.has(conversationId))
            this.upsertRecentConversationState(conversationId, existingThread, result.modelSettingsAtReadStart);
          return;
        }
        const turnsPagination = archivedPreview != null || retainHistoryPagination ? result.turnsPagination : undefined;
        const boundedMerge =
          archivedPreview == null &&
          !retainHistoryPagination &&
          maxTurns != null &&
          (this.conversations.get(conversationId)?.resumeState === "resumed" || response.thread.turns.length === 0);
        this.upsertRecentConversationState(conversationId, stale ? existingThread : response.thread, result.modelSettingsAtReadStart);
        if (!includeTurns || boundedMerge) return;
        const projectedTurns = projectTurns({
            threadId: response.thread.id,
            turns: response.thread.turns,
            model: "",
            reasoningEffort: null,
            cwd: response.thread.cwd || response.thread.cwd || "/",
            permissions: { approvalPolicy: "on-request", approvalsReviewer: null, activePermissionProfile: null },
          });
        const conversation = this.conversations.get(conversationId);
        const currentTurns = conversation == null ? [] : (mergedConversationTurns(conversation as never, AUTOMATION_DETECTOR as never) as any[]);
        this.updateConversationState(conversationId, (draft) => {
          const knownTurnIds = knownTurnIdsByConversation.get(conversationId) ?? new Set<string>();
          const inProgressTurns = currentTurns.filter(
            ({ status, turnId }: any) => (turnId == null ? status === "inProgress" : !knownTurnIds.has(turnId)),
          );
          const incomingTurnIds = new Set(projectedTurns.map((turn: any) => turn.turnId));
          const mergeBoundary = currentTurns.findIndex(
            (_turn: any, index: number) => (currentTurns[index] as any).turnId != null && (knownTurnIds.has((currentTurns[index] as any).turnId) || incomingTurnIds.has((currentTurns[index] as any).turnId)),
          );
          const hasTurnlessInProgress = inProgressTurns.some(({ status, turnId }: any) => turnId == null && status === "inProgress");
          const acceptedTurns = projectedTurns.filter(({ status }: any) => !hasTurnlessInProgress || status !== "inProgress");
          const acceptedTurnIds = new Set(acceptedTurns.map((turn: any) => turn.turnId));
          const fullItemsTurnIds = new Set(
            (response.thread.turns as any[]).filter((turn) => turn.itemsView === "full" && acceptedTurnIds.has(turn.id)).map((turn) => turn.id),
          );
          // 合并：保留现有终态 → 合入 incoming → 追加进行中的本地 turn。
          const merged = acceptedTurns.map((turn: any) =>
            turn.turnId == null || !fullItemsTurnIds.has(turn.turnId) || turn.itemsPagination?.hasLoadedOldest !== false
              ? turn
              : {
                  ...turn,
                  itemsPagination: {
                    ...turn.itemsPagination,
                    olderCursor: null,
                    isLoadingOlder: false,
                    hasLoadedOldest: true,
                    summaryItemIds: undefined,
                    reconnect: undefined,
                  },
                },
          );
          applyConversationTurns(
            draft as never,
            merged,
            turnsPagination?.hasLoadedOldest ?? (maxTurns == null || (conversation != null && hasCompleteHistory(conversation as never))),
            turnsPagination?.olderCursor == null
              ? null
              : { source: "paginated", cursor: turnsPagination.olderCursor, oldestLoadedTurnId: turnsPagination.oldestLoadedTurnId },
            AUTOMATION_DETECTOR,
          );
          if (turnsPagination != null) draft.turnsPagination = turnsPagination;
        });
      },
      notifyAnyConversationCallbacks: this.notifyAnyConversationCallbacks.bind(this),
      notifyConversationCallbacks: this.notifyConversationCallbacks.bind(this),
    });
  }

  /** 读线程（hydration 视角，原 `readHydrationThread`）：durable 走分页 turns。 */
  async readHydrationThread(threadId: string, { includeTurns = false, maxTurns, requestOptions }: { includeTurns?: boolean; maxTurns?: number; requestOptions?: unknown } = {}) {
    const generation = this.hydrationGeneration;
    const existingThread = this.threadsById.get(threadId);
    const context = {
      modelSettingsAtReadStart: this.captureThreadModelSettings(threadIdOf(threadId)),
      threadStatusAtReadStart: existingThread?.status,
    };
    const read = (withTurns: boolean) =>
      this.readThread(threadId, {
        includeTurns: withTurns,
        requestOptions: requestOptions ?? { priority: "background", source: "thread_hydration" },
      });
    if (!includeTurns) return { ...context, response: await read(false) };
    const isDurable = this.params.hostId === LONG_LIVED_HOST_ID;
    if (!isDurable && existingThread != null && existingThread.historyMode !== "paginated" && maxTurns == null)
      return { ...context, response: await read(true) };
    const metadata = await read(false);
    if (generation !== this.hydrationGeneration) return { ...context, response: metadata };
    if (!isDurable && metadata.thread.historyMode !== "paginated") {
      if (maxTurns == null) return { ...context, response: await read(true) };
      if (!this.params.requestClient.supportsPaginatedThreadHistory()) return { ...context, response: metadata };
    }
    if (maxTurns != null) {
      const turnsPage = isDurable
        ? await listDurableTurnsWithItems(
            this.params.requestClient.sendRequest.bind(this.params.requestClient) as never,
            threadId,
            null,
            maxTurns,
            requestOptions ?? { priority: "background", source: "collab_hydration" },
          )
        : await this.params.requestClient.sendRequest(
            "thread/turns/list",
            {
              threadId,
              cursor: null,
              limit: maxTurns,
              sortDirection: "desc",
              itemsView: requestOptions == null ? undefined : "full",
            },
            requestOptions ?? { priority: "background", source: "collab_hydration" },
          );
      return {
        ...context,
        response: { ...metadata, thread: { ...metadata.thread, turns: turnsPage.data.slice().reverse() } },
        turnsPagination: {
          olderCursor: turnsPage.nextCursor,
          oldestLoadedTurnId: turnsPage.data.at(-1)?.id ?? null,
          isLoadingOlder: false,
          hasLoadedOldest: turnsPage.nextCursor == null,
        },
      };
    }
    const turns: any[] = [];
    const seenCursors = new Set<string | null>();
    let cursor: string | null = null;
    do {
      if (cursor != null && seenCursors.has(cursor))
        throw new Error(`thread/turns/list returned a repeated cursor for thread ${threadId}`);
      if (cursor != null) seenCursors.add(cursor);
      const page = await (isDurable
        ? listDurableTurnsWithItems(
            this.params.requestClient.sendRequest.bind(this.params.requestClient) as never,
            threadId,
            cursor,
            5,
            requestOptions ?? { priority: "background", source: "collab_hydration" },
            "asc",
          )
        : this.params.requestClient.sendRequest(
            "thread/turns/list",
            { threadId, cursor, limit: 5, sortDirection: "asc", itemsView: "full" },
            requestOptions ?? { priority: "background", source: "collab_hydration" },
          ));
      if (generation !== this.hydrationGeneration) break;
      turns.push(...page.data);
      cursor = page.nextCursor;
    } while (cursor != null);
    return { ...context, response: { ...metadata, thread: { ...metadata.thread, turns } } };
  }

  recordThreadAvailability(conversationId: string) {
    this.backgroundThreadLookups.delete(conversationId);
    if (this.params.hostId === "durable") this.threadReadStates.delete(conversationId);
  }

  replaceThreadSummaries(summaries: ThreadSummary[]) {
    if (deepEqual(this.threadSummaries, summaries)) return;
    const previousById = this.threadSummariesById;
    const changed: string[] = [];
    const nextById = new Map<string, ThreadSummary>();
    for (const summary of summaries) {
      nextById.set(summary.conversationId, summary);
      if (!deepEqual(previousById.get(summary.conversationId), summary)) changed.push(summary.conversationId);
    }
    for (const conversationId of previousById.keys()) if (!nextById.has(conversationId)) changed.push(conversationId);
    this.threadSummaries = summaries;
    this.threadSummariesById = nextById;
    for (const conversationId of changed) {
      this.notifyThreadField(conversationId, "summary");
      if (!this.isConversationSuppressed(conversationId)) {
        this.notifyThreadField(conversationId, "titleState");
        if (this.conversations.has(conversationId)) this.notifyThreadField(conversationId, "listState");
      }
    }
    this.params.events.emitThreadSummaries(this.threadSummaries);
  }

  replaceRecentThreadSummaries(summaries: ThreadSummary[], limit = summaries.length) {
    const bounded = summaries.slice(0, limit);
    const boundedIds = new Set(bounded.map((summary) => summary.conversationId));
    this.replaceThreadSummaries([
      ...bounded,
      ...this.threadSummaries.filter((summary) => !boundedIds.has(summary.conversationId) && isSubagentThread(summary)),
    ]);
  }

  mergeRecentThreadSummaries(threads: ThreadRecord[], limit: number, hasMore: boolean) {
    const mergedIds = new Set<string>();
    const surfaced: ThreadSummary[] = [];
    for (const thread of threads) {
      const resolved = this.takeRuntimeStatusEvidence(thread);
      this.recordThreadAvailability(threadIdOf(resolved.id));
      this.threadsById.set(resolved.id, resolved);
      const summary = this.getThreadSummaryFromThread(resolved);
      mergedIds.add(summary.conversationId);
      if (this.shouldSurfaceThreadSummary(summary)) surfaced.push(summary);
    }
    this.replaceRecentThreadSummaries(
      [
        ...surfaced,
        ...(hasMore
          ? this.threadSummaries.filter(
              (summary) => !mergedIds.has(summary.conversationId) && !isSubagentThread(summary) && this.shouldSurfaceThreadSummary(summary),
            )
          : []),
      ],
      limit,
    );
  }

  getThreadSummaryFromThread(thread: ThreadRecord): ThreadSummary {
    const withMetadata = this.withThreadMetadata(thread);
    const conversationId = threadIdOf(withMetadata.id);
    const { createdAt, updatedAt, recencyAt } = threadTimestamps(withMetadata as { createdAt: number; updatedAt: number; recencyAt?: number | null });
    const conversation = this.conversations.get(conversationId);
    const summary = this.getThreadSummary(conversationId);
    const daybreakEnabled = conversation?.daybreakEnabled === undefined ? summary?.daybreakEnabled : conversation.daybreakEnabled;
    const currentRecency = conversation?.recencyAt ?? conversation?.updatedAt ?? summary?.recencyAt ?? summary?.updatedAt;
    return {
      conversationId,
      forkedFromId: withMetadata.forkedFromId == null ? null : threadIdOf(withMetadata.forkedFromId),
      hostId: this.params.hostId,
      createdAt,
      updatedAt,
      recencyAt: mergedRecencyAt({ currentRecencyAt: currentRecency, threadRecencyAt: recencyAt, updatedAt }),
      title: threadPreviewTitle(withMetadata, this.getCachedDisplayThreadTitle),
      cwd: withMetadata.cwd || null,
      ...environmentSelection(withMetadata as never, (conversation ?? summary) as never, "stored"),
      gitInfo: withMetadata.gitInfo,
      hasUnreadTurn: this.getThreadHasUnreadTurn(conversationId),
      historyMode: withMetadata.historyMode,
      canonicalVoiceHistory: hasCanonicalVoice(withMetadata),
      modelProvider: withMetadata.modelProvider,
      daybreakEnabled: withMetadata.daybreakEnabled === undefined ? daybreakEnabled : withMetadata.daybreakEnabled,
      parentThreadId: withMetadata.parentThreadId,
      mode: withMetadata.mode,
      threadStartKind: withMetadata.threadStartKind,
      originator: withMetadata.originator ?? conversation?.originator ?? summary?.originator,
      source: withMetadata.source,
      agentNickname: withMetadata.agentNickname,
      threadSource: withMetadata.threadSource,
      threadRuntimeStatus: isSubagentThread(withMetadata)
        ? (this.runtimeThreadStatusEvidenceByThreadId.get(withMetadata.id) ?? withMetadata.status)
        : withMetadata.status,
      workspaceKind: this.params.host.workspace.getThreadWorkspaceKind(conversationId, withMetadata),
    };
  }

  upsertRecentConversationState(conversationId: string, thread: ThreadRecord, modelSettingsAtReadStart?: { model: string; reasoningEffort: unknown } | null) {
    this.recordThreadAvailability(conversationId);
    const summary = this.getThreadSummary(conversationId);
    const withMetadata = this.withThreadMetadata(this.applyPendingThreadTitle(this.takeRuntimeStatusEvidence(thread)));
    upsertRecentConversationState({
      cachedRecencyAt: summary?.recencyAt ?? summary?.updatedAt,
      conversationId,
      conversations: this.conversations as never,
      getWorkspaceBrowserRoot: () => this.params.host.workspace.getThreadWorkspaceBrowserRoot(withMetadata),
      getProjectlessOutputDirectory: (id) => this.params.host.workspace.getThreadProjectlessOutputDirectory(id, withMetadata),
      getWorkspaceKind: (id) => this.params.host.workspace.getThreadWorkspaceKind(id, withMetadata),
      hostId: this.params.hostId,
      setConversation: (conversation: Conversation) => this.setConversation(conversation),
      thread: withMetadata as never,
      threadsById: this.threadsById as never,
      hasUnreadTurn: this.getThreadHasUnreadTurn(conversationId),
      modelSettingsAtReadStart,
      updateConversationState: (id: string, recipe: (draft: Conversation) => void) => this.updateConversationState(id, recipe),
    });
  }

  takeRuntimeStatusEvidence(thread: ThreadRecord) {
    if (isSubagentThread(thread)) return thread;
    const evidence = this.runtimeThreadStatusEvidenceByThreadId.get(thread.id);
    return evidence == null
      ? thread
      : (this.runtimeThreadStatusEvidenceByThreadId.delete(thread.id), { ...thread, status: evidence });
  }

  applyPendingThreadTitle(thread: ThreadRecord) {
    const pending = this.pendingThreadTitlesById.get(thread.id);
    return pending == null
      ? thread
      : cleanThreadTitle(thread.name) === pending
        ? (this.confirmedThreadTitlesById.set(thread.id, pending), this.pendingThreadTitlesById.delete(thread.id), thread)
        : { ...thread, name: pending };
  }

  upsertHydratedCollabReceiverConversation(thread: ThreadRecord, modelSettingsAtReadStart: { model: string; reasoningEffort: unknown } | null | undefined) {
    const withMetadata = this.withThreadMetadata(thread);
    const conversationId = threadIdOf(withMetadata.id);
    if (this.params.isConversationArchiving(conversationId)) return conversationId;
    this.registerThreadMetadata(withMetadata);
    this.ensureRecentConversationId(conversationId);
    const existing = this.conversations.get(conversationId);
    const title = cleanThreadTitle(withMetadata.name);
    const { updatedAt, recencyAt } = threadTimestamps(withMetadata as { createdAt: number; updatedAt: number; recencyAt?: number | null });
    const workspaceKind = this.params.host.workspace.getThreadWorkspaceKind(conversationId, withMetadata);
    const workspaceBrowserRoot = this.params.host.workspace.getThreadWorkspaceBrowserRoot(withMetadata);
    const projectlessOutputDirectory = this.params.host.workspace.getThreadProjectlessOutputDirectory(conversationId, withMetadata);
    if (existing) {
      const next = produce(existing, (draft) => {
        draft.sessionId = withMetadata.sessionId;
        draft.ephemeral = withMetadata.ephemeral;
        draft.rolloutPath = withMetadata.path || draft.rolloutPath;
        draft.cwd = withMetadata.cwd || draft.cwd;
        draft.originator = withMetadata.originator ?? draft.originator;
        draft.source = withMetadata.source;
        draft.agentNickname = withMetadata.agentNickname;
        draft.mode = withMetadata.mode;
        draft.threadStartKind = withMetadata.threadStartKind;
        draft.forkedFromId = withMetadata.forkedFromId == null ? null : threadIdOf(withMetadata.forkedFromId);
        draft.modelProvider = withMetadata.modelProvider;
        applyModelSettings(draft, withMetadata, modelSettingsAtReadStart);
        if (withMetadata.daybreakEnabled !== undefined) draft.daybreakEnabled = withMetadata.daybreakEnabled;
        draft.gitInfo = withMetadata.gitInfo ?? draft.gitInfo;
        draft.workspaceKind = workspaceKind;
        draft.workspaceBrowserRoot = workspaceKind === "projectless" ? (workspaceBrowserRoot ?? draft.workspaceBrowserRoot) : null;
        draft.projectlessOutputDirectory = workspaceKind === "projectless" ? (projectlessOutputDirectory ?? draft.projectlessOutputDirectory) : null;
        const currentRecency = draft.recencyAt ?? draft.updatedAt;
        draft.updatedAt = Math.max(draft.updatedAt, updatedAt);
        draft.recencyAt = mergedRecencyAt({ currentRecencyAt: currentRecency, threadRecencyAt: recencyAt, updatedAt });
        if (!draft.title && title) draft.title = title;
        if (draft.resumeState !== "resumed") draft.resumeState = "needs_resume";
      }) as Conversation;
      this.setConversation(next);
      this.notifyConversationCallbacks(conversationId);
      return conversationId;
    }
    this.setConversation(
      newConversationFromThread({
        thread: withMetadata as never,
        hostId: this.params.hostId,
        conversationId,
        turns: [],
        threadTitle: title,
        resumeState: "needs_resume",
        workspaceKind,
        workspaceBrowserRoot,
        projectlessOutputDirectory,
        hasUnreadTurn: this.getThreadHasUnreadTurn(conversationId),
        latestCollaborationMode: {
          mode: "default",
          settings: { reasoning_effort: null, model: "", developer_instructions: null },
        },
      }),
    );
    this.notifyConversationCallbacks(conversationId);
    this.params.onThreadAdded?.(withMetadata);
    return conversationId;
  }

  registerThreadMetadata(thread: ThreadRecord) {
    this.recordThreadAvailability(threadIdOf(thread.id));
    registerThreadMetadata({
      thread,
      threadsById: this.threadsById,
      conversations: this.conversations as never,
      updateConversationState: (id, recipe) => this.updateConversationState(id, recipe),
    });
  }

  shouldSurfaceRecentConversation(conversation: Conversation) {
    return (
      !this.isConversationSuppressed(conversation.id) &&
      conversation.ephemeral !== true &&
      conversation.sideConversation !== true &&
      (this.params.hostId === "local" || conversation.workspaceKind !== "projectless" || isProjectlessSurfaceable(conversation, this.params.hostId))
    );
  }

  shouldSurfaceThreadSummary(summary: ThreadSummary) {
    return (
      !this.isConversationSuppressed(summary.conversationId) &&
      this.conversations.get(summary.conversationId)?.sideConversation !== true &&
      (this.params.hostId === "local" || summary.workspaceKind !== "projectless" || isProjectlessSurfaceable(summary, this.params.hostId))
    );
  }

  async loadThreadHydrationState() {
    await this.params.host.workspace.load(true);
  }
}

/** projectless 可见性（原 `jv`：远端 host 恒不可见）。 */
function isProjectlessSurfaceable(_entity: Record<string, any>, _hostId: string): boolean {
  return false;
}

/** 标题规范化（60 字上限，原 `wv` 的 ThreadStore 用法）。 */
function normalizeTitle(title: string): string | null {
  const normalized = title.trim().replace(/\s+/g, " ");
  return normalized.length === 0 ? null : normalized.length <= 60 ? normalized : `${normalized.slice(0, 59).trimEnd()}…`;
}

// R4 装配侧按压缩名消费的兼容别名（切换语义名后移除）。
export { ThreadStore as T_e };
