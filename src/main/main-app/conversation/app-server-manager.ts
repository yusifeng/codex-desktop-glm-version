// AppServerConversationManager（原版 54,073-56,076 的 `rw` 类，~2,000 行）。
//
// 全区域 fan-in 汇点：每个 app-server host 连接一个实例（R5 64,825 装配）。
// 持有并编排全部会话服务：threadStore（R3 T_e）/streamState（R3 Yge）/
// pagination（R3 Kge）/streamRecovery/turnCoordinator/prewarmedThreadManager/
// realtimeThreadState/resumeNotificationBuffer/threadStartedNotificationDeferral/
// subagentTopology/threadWorkspaceStorage/projectlessConversations/lifecycle
// （R3 Khe 认证）/openFileWatches（R3 sve）等。
//
// 方法组（R4 深析 §3.3）：
//   生命周期（constructor/assertActive/static dispose/collectAppStateMetrics）、
//   resume/stream 所有权（#resumeConversation/runResume）、turn 执行
//   （startTurn/steerTurn/startEmptyTurn/sendFollowUpMessage/interrupt*/…）、
//   历史读取（readThread/listThreadTurns/load*Page/…）、列表/summary、
//   subagent、归档/fork、审批决策回执（replyWith*ApprovalDecision）、认证
//   （loginWith*/logout/…）、settings/权限、附件、workspace、事件订阅
//   （add*Callback/add*Listener）、未读/prewarm/杂项。
//
// 静态 API：static dispose（54,122）、static addTurnStartRequestedListener
// （54,776——被 automations/inbox-items 的 bindTurnCompletions 跨模块调用）。
//
// 依赖方向：本类 → 本区兄弟模块（turn-submission/turn-dispatch/turn-steer/
// stream-recovery/realtime-thread-state/subagent-topology/notification-deferral/
// conversation-creation/queued-follow-ups/thread-workspace-storage/turn-context）
// → R3 模块（threads/*、turns/*、conversations/*、requests/*、streams/*）。
// 无反向依赖。

import {
  $u as normalizeThreadId,
  Uf as ConversationEventEmitterBase,
  Zu as compareSemanticVersions,
  Wu as versionSupportsFeature,
  Zo as errorToString,
  us as isMcpMethodNotFoundError,
} from "@chunk/shared";
import { Sm as ConversationStreamSubscription } from "../app-server/stream-subscription";
import { Ah as ConversationEventBus } from "../conversations/event-bus";
import { kh as ConversationEvictionCoordinator } from "../conversations/eviction";
import { Khe as AccountAuthService } from "../auth/account-auth";
import { T_e as ThreadStore } from "../threads/thread-store";
import { ConversationHistoryReader as ConversationHistoryPagination } from "../threads/history-reader";
import { AppServerManagerStreamState } from "../threads/stream-roles";
import { Dve as InactiveThreadUnsubscriber } from "../threads/inactive-unsubscriber";
import { Bve as ManualContextCompactionTracker } from "../threads/context-compaction";
import { Rve as ItemNotificationHandler } from "../streams/item-notifications";
import {
  sve as OpenFileWatchRegistry,
  ny as delegateRequestToFollowerOwner,
  dve as handleThreadFollowerRequest,
} from "../files/open-file-watches";
import { $_e as FileAttachmentUploader, ive as ThreadGoalAttachmentDirectories } from "../attachments/upload";
import { q_e as DisposableHandle, Lv as AppServerOperationHandle, Rv as LoginOperationHandle } from "../util/dispose-handle";
import {
  Oge as findTurnAgentMessageText,
  Mg as completeHistoryTurns,
  kg as mergedTurns,
  Ag as findTurnById,
} from "../turns/canonical-history";
import { Cve as historyPolicyDefaults, Tve as recentHistoryLimit } from "../threads/history-policy";
import { environmentSelection as selectEnvironmentConfig } from "../threads/projection";
import { zv as applyThreadSettingsUpdate, D_e as collectConversationMetrics } from "../threads/patch-classification";
import { Wye as maybeResumeConversation } from "../threads/maybe-resume";
import { xye as buildResumeProduct, wye as buildDefaultTurnConfig } from "../threads/start-config";
import { ry as activeTurnId, iy as hasInProgressLocalTurn, ove as readThreadExecutionState } from "../files/open-file-watches";
import { TurnStartObservations } from "./stream-recovery";
import { createThreadSettingsUpdateRegistry } from "./thread-settings-update-registry";
// R3 threads/operations（42,479-43,548 fork/resume/projectless 操作群）。
import {
  Eye as editLastUserTurn,
  Mye as forkConversation,
  Tx as adoptForkedConversation,
  uve as forkConversationFromTurn,
  wx as synchronizeForkedThread,
  tx as createForkProduct,
  Iye as readDefaultPersonality,
  Fye as listMcpServers,
  Hye as resumeSubagentForFileApproval,
  dye as buildForkCapabilities,
} from "../threads/operations";
// R3 threads/fork-rollback（37,866-38,268）+ threads/history-policy（38,269-38,677）。
import {
  gve as ensureConversationHistoryLoaded,
  _ve as loadOlderConversationHistoryPage,
  hve as getCompleteConversationTurns,
  fve as applyRollbackResponse,
  pve as applyRevertResponse,
} from "../threads/fork-rollback";
import {
  bve as hydrateConversationSearchMatch,
  wve as readRecentThreadMessages,
  yve as ConversationPreviewRead,
  Tye as stopEphemeralThread,
} from "../threads/history-policy";
// R3 streams/notifications-apply（40,443-41,277 通知大 switch + 中断带）。
import {
  nb as applyNotification,
  Fy as addSyntheticCompactionItem,
  Ly as addCloudTaskSyntheticItem,
  Ry as addWorktreeInitSyntheticTurn,
  zy as removePlanImplementationRequest,
  Iy as addForkedFromConversationSyntheticItem,
  ib as subscribeToNotificationStream,
  Ave as interruptSubagentDescendants,
  Ove as interruptConversationCore,
  Pye as handleServerRequest,
} from "../streams/notifications-apply";
// R3 requests/item-synthesis（36,839-37,248 审批/动态工具合成）。
import {
  B_e as buildApprovalActionContext,
  M_e as replyWithCommandExecutionApprovalDecision,
  N_e as replyWithFileChangeApprovalDecision,
  P_e as replyWithPermissionsRequestApprovalResponse,
  F_e as replyWithUserInputResponse,
  U_e as replyWithOptionPickerResponse,
  W_e as replyWithDynamicToolResponse,
  ey as getDynamicToolRequest,
  H_e as removePendingDynamicToolRequest,
  Gv as replyWithMcpServerElicitationResponse,
  Xv as buildMcpServerElicitationItem,
  V_e as markInterruptedCommandExecutions,
} from "../requests/item-synthesis";
import { createAutoApprovedElicitation as beginUserVerification } from "../requests/elicitation-auto-approve";
// R3 threads/archive（41,278-41,455 归档流程）。
import {
  ab as archiveContextFactory,
  ub as archiveConversation,
  db as unarchiveConversation,
  fb as performArchiveConversation,
  ob as deleteArchivedConversation,
} from "../threads/archive";
// R3 tools/dynamic-app-tools（28,630-28,724）。
import { Th as buildOnboardingToolResponse } from "../tools/dynamic-app-tools";
// R1 杂项带（66-322）：me（thread_not_found 判定）、Xt（中断响应构造）。
import { me as isThreadNotFoundError, Xt as buildInterruptResponse } from "../misc/thread-errors";
// zge（33,263 中断命令执行标记）——R3 threads/projection。
import { markInterruptedCommandExecutions as markInterruptedCommandExecutionsInPlace } from "../turns/canonical-history";
// compactThread 的 follower 委托包装（原 ave，37,585 files/open-file-watches）。
import { ave as compactThreadViaFollower } from "../files/open-file-watches";
import {
  retrySafetyBufferedTurn,
  sendFollowUpMessage,
  runConversationCreationWithFirstTurn,
  startContinuationTurn,
} from "./turn-submission";
import { createExecuteTurnStart } from "./turn-dispatch";
import { steerTurn, stopConversation } from "./turn-steer";
import { StreamRecovery, ResumeNotificationBuffer } from "./stream-recovery";
import { ThreadGoalHydrationRegistry } from "./thread-goal-hydration-registry";
import { RealtimeThreadState, resumeRealtimeThreadGoal, setThreadGoalStatus, updateApprovalsReviewerForTurn } from "./realtime-thread-state";
import { SubagentTopology } from "./subagent-topology";
import {
  ThreadStartedNotificationDeferral,
  UnreadTurnState,
  PrewarmedThreadManager,
  subscribeReadStateChanges,
} from "./notification-deferral";
import { ConversationCreationExecutor, ConversationParamsBuilder } from "./conversation-creation";
import { createQueuedFollowUps } from "./queued-follow-ups";
import { ProjectlessConversations, ThreadWorkspaceStorage } from "./thread-workspace-storage";
import { createQueuedMessagesFacade } from "./turn-context";

/** turn/start 30s 超时（原 ym，27,872）。 */
const TURN_START_TIMEOUT_MS = 30_000;
/** owner 窗口错误文案（原 xm，27,878）。 */
const OWNER_WINDOW_ERROR = `Please continue this conversation on the window where it was started.`;
/** token-budget 线程的 storage 键（原 yb，41,459 R3 带）。 */
function tokenBudgetThreadKey(hostId: string, conversationId: string) {
  return `token-budget-thread:${hostId}:${conversationId}`;
}
/** thread-reference 能力键（原 Oh，28,722 R3 带）。 */
function threadReferenceCapabilityKey(conversationId: string) {
  return `thread-reference-capability:${conversationId}`;
}

/** 构造参数（R5 app-server 连接装配的接口契约，原 54,155-54,176）。 */
export interface AppServerManagerOptions {
  hostId: string;
  transport: { hostId: string; sendRequest: any; getAppServerVersion: () => string | null; supportsPaginatedThreadHistory?: () => boolean; prewarmThreadStart?: any; getPendingRequestCount?: () => number };
  logger: any;
  pendingThreadArchives: any;
  sendAppServerResponse: any;
  threadExecution: any;
  ipcBridge: any;
  coordination: any;
  scheduler: { schedule: any; scheduleMicrotask?: any };
  storage: any;
  threadProjectAssignments: any;
  savedReadState: any;
  filesystem: any;
  runtime: any;
  settings: any;
  tracing?: any;
  useTailHydration?: () => boolean;
  runtimeSettings?: any;
}

/**
 * AppServerConversationManager（原 `rw`，extends n.Uf）。
 * 每 host 连接一个实例；dispose 后全部操作抛 `App-server manager retired`。
 */
export class AppServerConversationManager extends ConversationEventEmitterBase {
  requestClient: any;
  manualContextCompactions: any;
  archivingConversationIds = new Set<string>();
  archivedPinnedThreadPlacements = new Map<string, unknown>();
  events = new ConversationEventBus();
  notificationContext: any;
  notificationReductionContext: any;
  projectlessConversations: ProjectlessConversations;
  itemStreamState: any;
  hostId: string;
  lifecycle: AccountAuthService;
  mcpServerStatusPromises = new Map<string, Promise<unknown>>();
  openFileWatches: OpenFileWatchRegistry;
  prewarmedThreadManager: PrewarmedThreadManager;
  inactiveThreadUnsubscriber: InactiveThreadUnsubscriber;
  pastedTextAttachments: FileAttachmentUploader;
  threadGoalAttachments: ThreadGoalAttachmentDirectories;
  threadSettingsUpdateSupport: `unknown` | `supported` | `unsupported` = `unknown`;
  threadWorkspaceStorage: ThreadWorkspaceStorage;
  threadCreation: ConversationCreationExecutor;
  conversationCacheEvictor: ConversationEvictionCoordinator;
  threadStore: ThreadStore;
  threadRecognition: any;
  history: any;
  pagination: ConversationHistoryPagination;
  subagentTopology: SubagentTopology;
  streamState: AppServerManagerStreamState;
  turnStartObservations: any;
  executeTurnStart: any;
  pendingThreadGoalHydrations = new ThreadGoalHydrationRegistry(() => this.disposed);
  pendingThreadSettingsUpdates = createThreadSettingsUpdateRegistry();
  defaultTurnConfig: any;
  inFlightConversationResumes = new Map<string, { promise: Promise<any>; cancel: () => void; source: string }>();
  streamRecovery: StreamRecovery;
  conversationReads = new Set<any>();
  userVerificationApprovals = new Map<string, any>();
  disposed = false;
  unread: UnreadTurnState;
  ownReadChange: { threadId: string; hasUnreadTurn: boolean } | null = null;
  realtimeThreadState: RealtimeThreadState;
  resumeNotificationBuffer = new ResumeNotificationBuffer();
  threadStartedNotificationDeferral: ThreadStartedNotificationDeferral;
  cleanup: (() => void)[] = [];
  canonicalTurnHistory: unknown;
  suppressResumeHistoryDrain: () => boolean;
  logger: any;
  useTailHydration: () => boolean;
  sendAppServerResponse: any;
  threadExecution: any;
  pendingThreadArchives: any;
  ipcBridge: any;
  scheduler: any;
  storage: any;
  readState: any;
  filesystem: any;
  runtime: any;
  settings: any;
  tracing: any;
  runtimeSettings: any;
  turnCoordinator: any;

  assertActive() {
    if (this.disposed) throw Error(`App-server manager retired`);
  }

  /** 静态 dispose：取消在途读/resume、释放全部子服务（原 54,122）。 */
  static dispose(manager: AppServerConversationManager) {
    manager.disposed = true;
    manager.pagination.dispose();
    manager.turnStartObservations.clear();
    for (let cancel of manager.conversationReads) cancel.cancel();
    manager.conversationReads.clear();
    for (let approval of manager.userVerificationApprovals.values()) approval.cancel();
    manager.userVerificationApprovals.clear();
    manager.turnCoordinator.dispose();
    manager.openFileWatches.dispose();
    for (let entry of manager.inFlightConversationResumes.values()) entry.cancel();
    manager.inFlightConversationResumes.clear();
    manager.streamRecovery.dispose();
    manager.threadStore.clearActiveConversationInterests();
    manager.pendingThreadGoalHydrations.clear();
    manager.pendingThreadSettingsUpdates.clear();
    for (let cleanup of manager.cleanup.splice(0)) cleanup();
    manager.realtimeThreadState.dispose();
    manager.inactiveThreadUnsubscriber.dispose();
    manager.streamState.dispose();
    manager.lifecycle.dispose();
    manager.prewarmedThreadManager.discardAllPrewarmedThreads();
  }

  /** 静态口：turn start 请求监听（被 InboxItemsFacade.bindTurnCompletions 消费）。 */
  static addTurnStartRequestedListener(manager: AppServerConversationManager, listener: (request: unknown) => void) {
    manager.assertActive();
    return manager.events.addTurnStartRequestedListener(listener);
  }

  constructor(options: AppServerManagerOptions) {
    super();
    let {
      hostId,
      transport,
      logger,
      pendingThreadArchives,
      sendAppServerResponse,
      threadExecution,
      ipcBridge,
      coordination,
      scheduler,
      storage,
      threadProjectAssignments,
      savedReadState,
      filesystem,
      runtime,
      settings,
      tracing = {},
      useTailHydration = () => settings.history.useTailHydration,
      runtimeSettings = {},
    } = options;
    if (transport.hostId !== hostId)
      throw Error(
        `AppServerRequestClient hostId ${transport.hostId} does not match AppServerManager hostId ${hostId}`,
      );
    this.logger = logger;
    // 原版：(e, t) => this.events.captureTurnStart(e, t, i)——capture 以
    // （上下文对象, 观察者注册器）调用。
    this.turnStartObservations = new TurnStartObservations(
      hostId,
      logger,
      (context: unknown, registerObserver: (observer: any) => () => void) =>
        this.events.captureTurnStart(context, registerObserver, logger),
    );
    this.cleanup.push(
      this.events.addStreamRoleStateCallback((state: any) => this.turnStartObservations.ownerChanged(state)),
      this.events.addTurnCompletedListener((event: any) => this.turnStartObservations.observeCompletion(event)),
    );
    this.executeTurnStart = createExecuteTurnStart(
      this,
      { runtime, filesystem, tracing, storage },
      this.turnStartObservations,
      () => this.assertActive(),
      () => !this.disposed,
      () => this.history.createSearchIslandId(),
      (request: unknown) => this.events.emitInitialTitleRequested(request),
    );
    this.pendingThreadArchives = pendingThreadArchives;
    this.sendAppServerResponse = sendAppServerResponse;
    this.threadExecution = threadExecution;
    this.ipcBridge = ipcBridge;
    this.scheduler = scheduler;
    this.storage = storage;
    this.readState = savedReadState;
    this.unread = new UnreadTurnState(savedReadState);
    this.defaultTurnConfig = buildDefaultTurnConfig(
      this,
      options,
      () => this.assertActive(),
      () => this.turnCoordinator.executionChanged(),
    );
    this.turnCoordinator = createQueuedFollowUps(
      this,
      { ipcBridge, logger, storage, tracing, settings, queuedMessageCoordination: coordination },
      (conversationId: string | null) => this.threadStore.notifyThreadField(conversationId, `queuedMessages`),
      threadExecution == null
        ? null
        : () =>
            createQueuedMessagesFacade(
              this,
              { runtime, settings, storage },
              (conversationId: string) => this.defaultTurnConfig.readServiceTier(conversationId),
              () => !this.disposed,
              (event: any) => this.events.emitQueuedMessageExecution(event),
              this.history.createSearchIslandId,
              (request: any, isExecutor: boolean) =>
                this.#resumeConversationAndReport(request, isExecutor ? `executor` : `view`),
            ),
      (request: any, isExecutor: boolean) =>
        this.#resumeConversationAndReport(request, isExecutor ? `executor` : `view`),
      () => this.history.createSearchIslandId(),
    );
    this.filesystem = filesystem;
    this.runtime = runtime;
    this.settings = settings;
    this.tracing = tracing;
    this.useTailHydration = useTailHydration;
    this.runtimeSettings = runtimeSettings;
    this.hostId = hostId;
    this.threadStartedNotificationDeferral = new ThreadStartedNotificationDeferral({
      logger: this.logger,
      getTurns: (conversationId: string) => {
        let conversation = this.getConversation(conversationId);
        return conversation == null ? null : mergedTurns(conversation as never, this.history.turnMergePolicy);
      },
      replayNotification: (method: string, params: any, automationCapability: unknown, shouldIgnore: boolean) => {
        this.onNotification(method, params, automationCapability, shouldIgnore);
      },
      replayRequest: (request: any) => {
        this.onRequest(request);
      },
    });
    this.canonicalTurnHistory =
      this.runtimeSettings.canonicalTurnHistory ?? settings.history.canonicalTurnHistory;
    this.suppressResumeHistoryDrain =
      this.runtimeSettings.suppressResumeHistoryDrain ??
      (() => this.supportsPaginatedThreadHistory() && settings.history.paginatedHistoryEnabled);
    this.requestClient = transport;
    this.threadRecognition = this.settings.restricted;
    let now = () => Date.now();
    this.prewarmedThreadManager = new PrewarmedThreadManager(
      (threadId: string) => this.requestClient.sendRequest(`thread/delete`, { threadId }),
      now,
    );
    let attachmentHost = this.filesystem.attachments;
    this.history = { ...historyPolicyDefaults, createSearchIslandId: () => attachmentHost.createId() };
    this.pastedTextAttachments = new FileAttachmentUploader({
      hostId: this.hostId,
      isLocalHost: this.hostId === `local`,
      host: attachmentHost,
      requestClient: this.requestClient,
    });
    this.threadGoalAttachments = new ThreadGoalAttachmentDirectories({ host: attachmentHost, requestClient: this.requestClient });
    this.lifecycle = new AccountAuthService(
      this.requestClient,
      this.runtime,
      this.logger,
      this.runtime.hasDesktopRuntime && this.hostId !== `local`,
      this.scheduler.schedule,
    );
    let clearObservations = () => this.turnStartObservations.clear();
    this.lifecycle.addAuthStatusCallback(clearObservations);
    this.cleanup.push(() => this.lifecycle.removeAuthStatusCallback(clearObservations));
    this.projectlessConversations = new ProjectlessConversations({
      hostId: this.hostId,
      storage,
      threadProjectAssignments,
      getConversation: (conversationId: string) => this.getConversation(conversationId),
      logger: this.logger,
      getWorkspaceKindOverride: (conversationId: string) => {
        let state = this.getThreadWorkspaceState(conversationId);
        if (state != null) return state.project == null ? `projectless` : `project`;
      },
    });
    this.threadWorkspaceStorage = new ThreadWorkspaceStorage({
      storage,
      threadProjectAssignments,
      createProjectlessWorkspace: (title: string | null) =>
        filesystem.createProjectlessThreadWorkspace(title),
    });
    this.openFileWatches = new OpenFileWatchRegistry({
      logger: this.logger,
      createId: () => attachmentHost.createId(),
      getWatchPath: (conversationId: string, filePath: string) =>
        this.filesystem.getOpenFileWatchPath(this.getConversationCwd(conversationId) ?? ``, filePath, this.hostId),
      requestClient: this.requestClient,
      schedule: this.scheduler.schedule,
    });
    this.threadStore = new ThreadStore({
      parseUrl: this.runtime.parseUrl,
      readQueuedMessages: this.turnCoordinator.readMessages,
      logger: this.logger,
      hostId: this.hostId,
      host: {
        threadMode: this.runtime.threadMode(this.hostId),
        readThreadListOriginators: () => settings.history.readThreadListOriginators?.(),
        threadRecognition: this.threadRecognition,
        workspace: this.projectlessConversations as never,
        removeOpenFileWatches: (conversationId: string) => {
          this.openFileWatches.removeConversation(conversationId);
        },
        createId: () => attachmentHost.createId(),
        schedule: this.scheduler.schedule,
      },
      events: this.events,
      canBroadcastPatchesToFollowers: (conversationId: string) => this.streamState.canBroadcastIpcStatePatches(conversationId),
      isConversationArchiving: this.isConversationArchiving.bind(this),
      requestClient: this.requestClient,
      persistThreadTitle: (request: any) => this.sendRequest(`thread/name/set`, request),
      getHistoryLimit:
        this.runtimeSettings.getRecentConversationDiscoveryLimit ??
        (() =>
          recentHistoryLimit(
            this.hostId,
            this.runtime.hasDesktopRuntime,
            settings.history.readCatalogConsumptionEnabled() === true,
          )),
      onThreadAdded: this.runtimeSettings.onThreadAdded,
      savedReadState: this.readState,
    });
    this.pagination = new ConversationHistoryPagination(
      this as never,
      this.history,
      this.runtime.readCompactHistory,
      this.tracing.beginHistoryPage,
    );
    this.manualContextCompactions = new ManualContextCompactionTracker(this.threadStore, (conversationId: string, request: any, options: any) =>
      addSyntheticCompactionItem(this, conversationId, request, options, this.history),
    );
    this.subagentTopology = new SubagentTopology({
      requestClient: this.requestClient,
      compareSemanticVersions,
      threadStore: this.threadStore,
    });
    this.realtimeThreadState = new RealtimeThreadState({
      events: this.events,
      logger: this.logger,
      manager: this,
      getDefaultFeatureOverride: this.getDefaultFeatureOverride.bind(this),
    });
    this.streamState = new AppServerManagerStreamState({
      logger: this.logger,
      hostId: this.hostId,
      transport: coordination,
      schedule: this.scheduler.schedule,
      followerReconnectGraceMs: 5_000,
      canHandleOwnerlessDynamicTool: () => this.runtime.hasDesktopRuntime && this.hostId === `local`,
      isLocalHost: (hostId: string) => hostId === `local`,
      threadStore: this.threadStore,
      events: this.events,
      markConversationNeedsResumeForUnavailableOwner: this.markConversationNeedsResumeForUnavailableOwner.bind(this),
    });
    this.inactiveThreadUnsubscriber = new InactiveThreadUnsubscriber({
      logger: this.logger,
      threadStore: this.threadStore,
      events: this.events,
      requestClient: this.requestClient,
      streamState: this.streamState,
      parseUrl: this.runtime.parseUrl,
      beforePassiveRelease: (conversationId: string) => this.turnStartObservations.unload(conversationId),
      now,
      schedule: this.scheduler.schedule,
      scheduleMicrotask: this.scheduler.scheduleMicrotask,
    });
    this.streamRecovery = new StreamRecovery({
      manager: this,
      streamState: this.streamState,
      threadStore: this.threadStore,
      pagination: this.pagination,
      resumeNotificationBuffer: this.resumeNotificationBuffer,
      inFlightConversationResumes: this.inFlightConversationResumes,
      schedule: this.scheduler.schedule,
      clearConversationStreamOwnership: (conversationId: string) =>
        this.inactiveThreadUnsubscriber.clearConversationStreamOwnership(conversationId),
      resume: (conversation: any) =>
        this.#resumeConversation(
          {
            conversationId: conversation.id,
            model: null,
            reasoningEffort: null,
            workspaceRoots: conversation.cwd ? [conversation.cwd] : [`/`],
            collaborationMode: conversation.latestCollaborationMode,
          },
          `recovery`,
          undefined,
          true,
        ),
      isDisposed: () => this.disposed,
    });
    this.threadCreation = new ConversationCreationExecutor({
      logger: this.logger,
      hostId: this.hostId,
      prewarmedThreadManager: this.prewarmedThreadManager,
      projectlessConversations: this.projectlessConversations,
      requestClient: this.requestClient,
      threadStore: this.threadStore,
      setConversation: (conversation: any) => {
        this.setConversation(conversation);
        this.streamState.setConversationStreamRole(conversation.id, { role: `owner` });
      },
      configuration: this.settings,
      initializationCapabilities: this.filesystem.initialization,
      setTokenBudgetThread: (conversationId: string) => this.storage.writeValue(tokenBudgetThreadKey(this.hostId, conversationId), true),
      getThreadReferencesSupported: (conversationId: string) => this.storage.readValue(threadReferenceCapabilityKey(conversationId)) === true,
      setThreadReferencesSupported: (conversationId: string, supported: boolean) =>
        this.storage.writeValue(threadReferenceCapabilityKey(conversationId), supported),
      canonicalTurnHistory: this.canonicalTurnHistory,
      usePaginatedThreadHistory: () =>
        this.hostId !== `durable` && this.suppressResumeHistoryDrain() && this.supportsPaginatedThreadHistory(),
      mergeThreadWritableRoots: (conversationId: string, roots: string[]) => this.mergeThreadWritableRoots(conversationId, roots),
    });
    this.itemStreamState = new ItemNotificationHandler({
      hostId: this.hostId,
      scheduler: this.scheduler,
      logger: this.logger,
      now,
      threadStore: this.threadStore as never,
    });
    this.conversationCacheEvictor = new ConversationEvictionCoordinator({
      clearPersistedUnreadState: (conversationId: string) => this.saveReadState(conversationId, false),
      emitThreadArchived: this.events.emitThreadArchived.bind(this.events),
      invalidateResumeState: (conversationId: string, reason: string) => {
        reason === `archive` || reason === `archive-notification`
          ? this.turnStartObservations.unload(conversationId)
          : this.turnStartObservations.retire(conversationId);
        this.pagination.cancelItemLoads(conversationId);
        this.inFlightConversationResumes.get(conversationId)?.cancel();
        this.inFlightConversationResumes.delete(conversationId);
        this.pendingThreadGoalHydrations.cancel(conversationId);
      },
      inactiveThreadUnsubscriber: this.inactiveThreadUnsubscriber,
      itemStreamState: this.itemStreamState,
      manualContextCompactions: this.manualContextCompactions,
      resumeNotificationBuffer: this.resumeNotificationBuffer,
      threadStartedNotificationDeferral: this.threadStartedNotificationDeferral,
      threadStore: this.threadStore,
      unread: this.unread,
    });
    this.notificationContext = {
      events: this.events,
      getLastAgentMessageForTurn: (conversationId: string, turnId: string) =>
        findTurnAgentMessageText(this.conversations.get(conversationId) as never, turnId, this.history.turnMergePolicy),
      handleThreadArchived: this.handleThreadArchived.bind(this),
      handleThreadDeletion: this.handleThreadDeletion.bind(this),
      handleThreadUnarchived: this.handleThreadUnarchived.bind(this),
      hydrateCollabThreads: (threadIds: string[]) => {
        this.threadStore.hydrateCollabThreads(threadIds);
      },
      itemStreamState: this.itemStreamState,
      lifecycle: this.lifecycle,
      manualContextCompactions: this.manualContextCompactions,
      openFileWatches: this.openFileWatches,
      handleRealtimeItemAdded: this.realtimeThreadState.handleItemAdded.bind(this.realtimeThreadState),
      resumeNotificationBuffer: this.resumeNotificationBuffer,
      streamState: this.streamState,
      subagentTopology: this.subagentTopology,
      threadStartedNotificationDeferral: this.threadStartedNotificationDeferral,
      threadStore: this.threadStore,
      turnMergePolicy: this.history.turnMergePolicy,
      unread: this.unread,
      updateTurnState: this.updateTurnState.bind(this),
      upsertConversationFromThread: this.threadStore.upsertConversationFromThread.bind(this.threadStore),
    };
    this.notificationReductionContext = {
      observeTurnStart: (conversationId: string, turnId: string) => this.turnStartObservations.observeStart(conversationId, turnId),
      manager: this,
      notificationContext: this.notificationContext,
      // 原版 b = this.settings.restricted（threadRecognition 同源对象）。
      hasRuntimeSession: (conversationId: string) => this.settings.restricted?.hasSession(conversationId) ?? false,
      readQueuedFollowUpHead: this.turnCoordinator.readHead,
      supportsGoalContinuation: this.runtime.hasDesktopRuntime,
      createId: this.history.createSearchIslandId,
    };
    this.cleanup.push(
      (subscribeReadStateChanges(
        this.readState,
        this.unread,
        () => this.threadStore.getSavedReadChanges(),
        ({ threadId, hasUnreadTurn }: any) => {
          (this.ownReadChange?.threadId !== threadId || this.ownReadChange.hasUnreadTurn !== hasUnreadTurn) &&
            this.applySavedConversationReadState(threadId, hasUnreadTurn);
        },
      ) as () => void),
    );
    if (coordination != null) {
      this.streamState.attach();
      if (ipcBridge != null) {
        this.cleanup.push(
          ipcBridge.registerBroadcastHandler(`thread-archived`, ({ params }: any) => {
            params.hostId === hostId && this.handleThreadArchived(params.conversationId);
          }),
          ipcBridge.registerBroadcastHandler(`thread-unarchived`, ({ params }: any) => {
            params.hostId === hostId && this.handleThreadUnarchived(params.conversationId);
          }),
        );
      }
      this.cleanup.push(subscribeToNotificationStream(this, this.history.turnMergePolicy));
    }
  }

  // -------------------------------------------------------------------------
  // 基础访问
  // -------------------------------------------------------------------------

  getHostId() {
    return this.hostId;
  }

  canUsePermissionSelection(conversationId: string) {
    return this.getConversation(conversationId) != null && true;
  }

  getConversationTurnItemLimit(conversationId: string) {
    this.getConversation(conversationId);
    return Infinity;
  }

  /** 订阅通知/事件/会话/host/thread 流（原 subscribe）。 */
  subscribe(subscription: any) {
    if (subscription.key.hostId !== this.hostId) throw Error(`Cannot subscribe to a different execution host`);
    return subscription.type === `notification`
      ? ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
          this.events.addNotificationCallback(subscription.methods, listener),
        )
      : subscription.type === `event`
        ? subscription.event === `auth-status`
          ? ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) => (
              this.lifecycle.addAuthStatusCallback(listener),
              () => this.lifecycle.removeAuthStatusCallback(listener)
            ))
          : subscription.event === `realtime-handoff-attributed`
            ? ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                this.events.addRealtimeHandoffAttributedListener(listener),
              )
            : subscription.event === `conversation-removed`
              ? ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                  this.events.addConversationRemovedListener(listener),
                )
              : subscription.event === `thread-deleted`
                ? ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                    this.events.addThreadDeletedListener(listener),
                  )
                : subscription.event === `thread-archived`
                  ? ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                      this.events.addThreadArchivedListener(listener),
                    )
                  : subscription.event === `thread-unarchived`
                    ? ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                        this.events.addThreadUnarchivedListener(listener),
                      )
                    : subscription.event === `turn-completed`
                      ? subscription.includeCompletedTurn
                        ? ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                            this.events.addTurnCompletedListener((event: any) => {
                              let turn =
                                event.turnId == null
                                  ? null
                                  : findTurnById(this.getConversation(event.conversationId) as never, event.turnId, this.history.turnMergePolicy);
                              turn == null
                                ? listener({ event, completedTurn: { status: `missing` } })
                                : turn.itemsPagination?.hasLoadedOldest === false
                                  ? listener({ event, completedTurn: { status: `incomplete` } })
                                  : listener({ event, completedTurn: { status: `ready`, turn } });
                            }),
                          )
                        : ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                            this.events.addTurnCompletedListener(listener),
                          )
                      : ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                          this.events.addThreadListInvalidatedListener(() => listener(undefined)),
                        )
        : subscription.type === `conversation`
          ? ConversationStreamSubscription.subscribeConversation(
              subscription.listener,
              (listener: any) => this.threadStore.subscribe({ ...subscription, listener }),
              () => this.threadStore.getTranscript(subscription.key.threadId),
            )
          : subscription.type === `host`
            ? ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                this.threadStore.subscribe({ ...subscription, listener }),
              )
            : subscription.type === `thread`
              ? (subscription.field === `queuedMessages` &&
                  this.turnCoordinator.loadSubscribedMessages(subscription.key.threadId),
                ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                  this.threadStore.subscribe({ ...subscription, listener }),
                ))
              : (subscription.type,
                ConversationStreamSubscription.subscribe(subscription.listener, (listener: any) =>
                  this.threadStore.subscribe({ ...subscription, listener }),
                ));
  }

  getThreadHasUnreadTurn(conversationId: string) {
    return this.threadStore.getThreadHasUnreadTurn(conversationId);
  }

  beginResumeNotificationBuffer(conversationId: string) {
    this.resumeNotificationBuffer.begin(conversationId);
  }

  releaseResumeNotificationBuffer(conversationId: string) {
    let conversation = this.getConversation(conversationId);
    this.resumeNotificationBuffer.release(
      conversationId,
      conversation == null ? null : mergedTurns(conversation as never, this.history.turnMergePolicy),
      ({ notification, automationCapability }: any, shouldIgnore: boolean) => {
        this.onNotification(notification.method, notification.params, automationCapability, shouldIgnore);
      },
      (request: any) => {
        this.onRequest(request);
      },
    );
  }

  beginThreadGoalHydration(conversationId: string) {
    return this.pendingThreadGoalHydrations.begin(conversationId);
  }

  isCurrentThreadGoalHydration(conversationId: string, symbol: symbol) {
    return this.pendingThreadGoalHydrations.isCurrent(conversationId, symbol);
  }

  endThreadGoalHydration(conversationId: string, symbol: symbol) {
    return this.pendingThreadGoalHydrations.end(conversationId, symbol);
  }

  get conversations() {
    return this.threadStore.conversations;
  }

  getStreamRole(conversationId: string) {
    return this.streamState.getStreamRole(conversationId);
  }

  getConversationStreamRevision(conversationId: string) {
    return this.streamState.getConversationRevision(conversationId);
  }

  addStreamRoleCallback(conversationId: string, callback: any) {
    return this.events.addStreamRoleCallback(conversationId, callback);
  }

  markDurableAeonStopped(conversationId: string) {
    this.streamRecovery.markDurableAeonStopped(conversationId);
  }

  markConversationNeedsResumeForUnavailableOwner(conversationId: string, ownerClientId: string) {
    this.streamRecovery.markConversationNeedsResumeForUnavailableOwner(conversationId, ownerClientId);
  }

  resumeConversationForUnavailableOwner(request: any, readResumeInputs?: any) {
    return this.#resumeConversation(request, `view`, readResumeInputs);
  }

  /** resume 核心（原 #e）：in-flight 去重（同源/recovery 复用，跨源等前一个落定）、
   *  非活跃窗口跳过、Wye 大 resume、落定后通知 streamRecovery。 */
  async #resumeConversation(request: any, source: string, readResumeInputs?: any, isReconnectRecovery = false) {
    if (this.disposed) throw Error(`App server manager was disposed`);
    let canAcquireOwnership = () =>
      source === `executor`
        ? this.runtime.queuedMessages.canAcquireOwnership()
        : (this.getWindowActivity()?.canAcquireThreadStream ?? true);
    let windowActivity = this.getWindowActivity();
    if (this.getStreamRole(request.conversationId) == null && !canAcquireOwnership()) {
      this.ensureRecentConversationId(request.conversationId);
      this.logger.info(`maybe_resume_skipped_inactive_hotkey_window`, {
        safe: { conversationId: request.conversationId, documentVisibilityState: windowActivity?.visibilityState },
        sensitive: { hostId: this.getHostId(), routePath: windowActivity?.routePath },
      });
      return { status: `not-ready`, reason: `inactive-window` };
    }
    let inFlight = this.inFlightConversationResumes.get(request.conversationId);
    if (inFlight != null) {
      if (inFlight.source === source || source === `recovery`) return inFlight.promise;
      let removed = false;
      let unsubscribe = this.events.addConversationRemovedListener((conversationId: string) => {
        conversationId === request.conversationId && (removed = true);
      });
      let result: any;
      try {
        try {
          await inFlight.promise;
        } catch {}
        if (removed || this.disposed) return { status: `not-ready`, reason: `canceled` };
        result = this.#resumeConversation(request, source, readResumeInputs, isReconnectRecovery);
      } finally {
        unsubscribe();
      }
      return result;
    }
    let product = buildResumeProduct(
      { ...this.settings, beginHydration: this.tracing.beginHydration },
      this.requestClient,
      this.logger,
      this.history,
      (conversationId: string) => this.canUsePermissionSelection(conversationId),
      readResumeInputs,
    );
    let hydrationCleanup: (() => void) | undefined;
    let runHydrationCleanup = () => {
      let cleanup = hydrationCleanup;
      hydrationCleanup = undefined;
      cleanup?.();
    };
    let resumeResult: any = null;
    let resumeError: unknown;
    let promise = Promise.resolve()
      .then(() =>
        maybeResumeConversation({
          manager: this as any,
          workspace: this.projectlessConversations as never,
          params: request,
          product,
          historyPolicy: this.history,
          schedule: this.scheduler.schedule,
          isReconnectRecovery,
          canAcquireOwnership,
          isCurrentResumeAttempt: () =>
            !this.disposed && this.inFlightConversationResumes.get(request.conversationId) === entry,
          setHydrationCleanup: (cleanup: () => void) => {
            hydrationCleanup = cleanup;
            (this.disposed || this.inFlightConversationResumes.get(request.conversationId) !== entry) && runHydrationCleanup();
          },
        }),
      )
      .then((result: any) => ((resumeResult = result), result))
      .catch((error: unknown) => {
        throw ((resumeError = error), error);
      })
      .finally(() => {
        runHydrationCleanup();
        this.inFlightConversationResumes.get(request.conversationId) === entry &&
          (this.streamRecovery.onResumeAttemptSettled(request.conversationId, resumeResult, resumeError),
          this.inFlightConversationResumes.delete(request.conversationId));
      });
    let entry = { promise, cancel: runHydrationCleanup, source };
    this.inFlightConversationResumes.set(request.conversationId, entry);
    return promise;
  }

  async resumeThread(request: any) {
    let response = await this.sendRequest(`thread/resume`, request);
    this.updateConversationState(normalizeThreadId(response.thread.id), (state: any) => {
      Object.assign(state, selectEnvironmentConfig(response.thread, state, `live`));
    });
    return response;
  }

  async resumeConversation(request: any, options?: any) {
    return this.#resumeConversationAndReport(request, `view`, options?.readResumeInputs);
  }

  /** resume + 结果包装（原 #t）：not-ready 原样返回，ready 附 activeTurnId。 */
  async #resumeConversationAndReport(request: any, source: string, readResumeInputs?: any) {
    let result: any;
    try {
      result = await this.#resumeConversation(request, source, readResumeInputs);
    } finally {
      readResumeInputs?.[Symbol.dispose]?.();
    }
    if (result.status === `not-ready`) return result;
    let conversation = this.getConversation(request.conversationId);
    return {
      status: `ready`,
      activeTurnId: activeTurnId(conversation, this.history.turnMergePolicy) ?? null,
      threadSource: conversation?.threadSource ?? null,
    };
  }

  assertThreadFollowerOwner(conversationId: string) {
    if (this.getStreamRole(conversationId)?.role !== `owner`) throw Error(OWNER_WINDOW_ERROR);
  }

  // -------------------------------------------------------------------------
  // turn 执行
  // -------------------------------------------------------------------------

  editLastUserTurn(conversationId: string, options: any) {
    return editLastUserTurn({
      manager: this,
      conversationId,
      options,
      startTurn: (request: any, bufferedTurn: any, useAppServerPermissionDefault: boolean) =>
        this.executeTurnStart(conversationId, {
          request,
          context: {
            attachments: bufferedTurn.params.attachments,
            commentAttachments: bufferedTurn.params.commentAttachments,
            useAppServerPermissionDefault,
            writingBlockContextPrepared: options.writingBlockContextPrepared,
            mcpAppModelContextAttachments: bufferedTurn.mcpAppModelContextAttachments,
          },
        }),
      turnMergePolicy: this.history.turnMergePolicy,
      ownerWindowError: OWNER_WINDOW_ERROR,
    });
  }

  startTurn(conversationId: string, operation: any, onMessageAdded?: unknown) {
    return this.executeTurnStart(conversationId, operation, `direct`, undefined, onMessageAdded);
  }

  getTurnCoordinator() {
    return this.turnCoordinator;
  }

  startEmptyTurn(conversationId: string, options: any) {
    return startContinuationTurn({
      conversationId,
      manager: this,
      options,
      resumeConversation: (request: any) => this.#resumeConversation(request, `view`),
      startTurn: (operation: any) => this.executeTurnStart(conversationId, operation),
      turnMergePolicy: this.history.turnMergePolicy,
    });
  }

  steerTurn(
    conversationId: string,
    input: any[],
    restoreMessage: any,
    serviceTier: unknown,
    attachments: any,
    clientUserMessageId: string | undefined,
    additionalContext: Record<string, unknown> | undefined,
    toolOutput: unknown,
    onMessageAdded?: unknown,
  ) {
    this.assertActive();
    let messageId = clientUserMessageId ?? this.history.createSearchIslandId();
    return steerTurn({
      manager: this,
      conversationId,
      input,
      restoreMessage,
      serviceTier,
      attachments,
      clientUserMessageId: messageId,
      additionalContext,
      toolOutput,
      onMessageAdded: onMessageAdded as (() => unknown) | undefined,
      createId: this.history.createSearchIslandId,
      schedule: (callback: () => void, delayMs: number) => this.scheduler.schedule(callback, delayMs),
      ownerWindowError: OWNER_WINDOW_ERROR,
    });
  }

  sendFollowUpMessage(conversationId: string, options: any) {
    return sendFollowUpMessage({
      conversationId,
      createId: this.history.createSearchIslandId,
      manager: this,
      options,
    });
  }

  async handleThreadFollowerRequest(request: any) {
    return handleThreadFollowerRequest(this, request);
  }

  getDefaultFeatureOverride(key: string) {
    return this.settings.readDefaultFeatureOverrides()?.[key];
  }

  readDefaultPersonality(cwd: string | null, threadConfig?: unknown) {
    return readDefaultPersonality(this.requestClient, this.settings, cwd, threadConfig);
  }

  // -------------------------------------------------------------------------
  // 认证
  // -------------------------------------------------------------------------

  addAuthStatusCallback(callback: any) {
    this.lifecycle.addAuthStatusCallback(callback);
  }

  removeAuthStatusCallback(callback: any) {
    this.lifecycle.removeAuthStatusCallback(callback);
  }

  addMcpLoginCallback(callback: any) {
    return this.lifecycle.addMcpLoginCallback(callback);
  }

  applyThreadTitleUpdateAndNotify(conversation: any) {
    this.setConversation(conversation);
    this.threadStore.notifyConversationCallbacks(conversation.id);
    this.events.emitAnyConversations(this.getRecentConversations());
  }

  setThreadTitle(conversationId: string, title: string, options = {}) {
    this.activateThreadSummary(conversationId);
    return this.threadStore.setThreadTitle(conversationId, title, options);
  }

  updateTurnState(conversationId: string, turnId: string, updater: any, options: any) {
    this.threadStore.updateTurnState(conversationId, turnId, updater, { findTurnOptions: options });
  }

  getMcpServerElicitationItem(requestId: string, params: any, completed: boolean, action: unknown) {
    return buildMcpServerElicitationItem(requestId, params, completed, action);
  }

  // -------------------------------------------------------------------------
  // 会话读取
  // -------------------------------------------------------------------------

  getConversation(conversationId: string) {
    return this.threadStore.getConversation(conversationId);
  }

  getConversationTitleInput(conversationId: string) {
    return this.threadStore.getConversationTitleInput(conversationId);
  }

  getRealtimeCallMetadata(conversationId: string) {
    return this.threadStore.getRealtimeCallMetadata(conversationId);
  }

  getThreadExecutionState(conversationId: string, turnId: string | null) {
    return readThreadExecutionState(
      this.getConversation(conversationId),
      turnId == null ? null : this.getTurn(conversationId, `turn:${turnId}`),
      this.history.turnMergePolicy,
    );
  }

  readConversationContext(conversationId: string, options: any) {
    let read = new ConversationPreviewRead(this, conversationId, options, this.history);
    return this.disposed
      ? (read.cancel(), read)
      : (this.conversationReads.add(read),
        read.getResult().then(() => this.conversationReads.delete(read)),
        read);
  }

  readRecentThreadMessages(conversationId: string, options: any) {
    return readRecentThreadMessages(this.getConversation(conversationId), options);
  }

  getTurn(conversationId: string, turnKey: string) {
    return this.threadStore.getTurn(conversationId, turnKey);
  }

  addCloudTaskSyntheticItem(conversationId: string, item: any) {
    addCloudTaskSyntheticItem(this, conversationId, item, this.history);
  }

  addWorktreeInitSyntheticTurn(conversationId: string, worktreeInit: any) {
    addWorktreeInitSyntheticTurn(this, conversationId, worktreeInit, this.history, `new-turn`);
  }

  removePlanImplementationRequest(conversationId: string, requestId: string) {
    removePlanImplementationRequest(this, conversationId, requestId);
  }

  // -------------------------------------------------------------------------
  // workspace
  // -------------------------------------------------------------------------

  async getThreadProjectAssignment(conversationId: string) {
    return this.threadWorkspaceStorage.getProjectAssignment(conversationId);
  }

  async getThreadWritableRoots(conversationId: string) {
    return this.threadWorkspaceStorage.getWritableRoots(conversationId);
  }

  getThreadWorkspaceState(conversationId: string) {
    return this.threadWorkspaceStorage.getWorkspaceState(conversationId);
  }

  async commitThreadWorkspaceTransition(conversationId: string, revision: string, applied: unknown) {
    this.threadWorkspaceStorage.commitWorkspaceTransition(conversationId, revision, applied);
  }

  getWorkspacesRoot() {
    return this.filesystem.initialization.readWorkspacesRoot();
  }

  getCodexHome() {
    return this.filesystem.initialization.readCodexHome();
  }

  ensureDirectory(path: string, environmentId?: string) {
    return this.filesystem.initialization.ensureDirectory(path, environmentId);
  }

  async createProjectlessThreadWorkspace(title: string | null) {
    return this.threadWorkspaceStorage.createProjectlessThreadWorkspace(title);
  }

  async isProjectlessConversation(conversationId: string) {
    return this.projectlessConversations.hasConversationId(conversationId);
  }

  async mergeThreadWritableRoots(conversationId: string, roots: string[]) {
    await this.threadWorkspaceStorage.mergeWritableRoots(conversationId, roots);
  }

  async replaceThreadWritableRoots(conversationId: string, roots: string[]) {
    await this.threadWorkspaceStorage.replaceWritableRoots(conversationId, roots);
  }

  // -------------------------------------------------------------------------
  // 压缩 / 流 / 附件
  // -------------------------------------------------------------------------

  registerPendingManualContextCompaction(conversationId: string) {
    this.manualContextCompactions.register(conversationId);
  }

  removePendingManualContextCompaction(conversationId: string) {
    this.manualContextCompactions.remove(conversationId);
  }

  isConversationStreaming(conversationId: string) {
    return this.streamState.isConversationStreaming(conversationId);
  }

  uploadLocalFileAttachments(paths: string[]) {
    return this.pastedTextAttachments.uploadLocalFiles(paths);
  }

  async createFileAttachment({ contents, label }: { contents: unknown; label: string }) {
    return this.pastedTextAttachments.createBlob(contents, label);
  }

  async createThreadGoalAttachmentDirectory() {
    return this.threadGoalAttachments.createDirectory();
  }

  async writeThreadGoalAttachment(content: unknown) {
    return this.threadGoalAttachments.write(content);
  }

  async removeThreadGoalAttachmentDirectory(directory: string) {
    await this.threadGoalAttachments.remove(directory);
  }

  async copyLocalFileAttachment({ sourcePath, label }: { sourcePath: string; label: string }) {
    return this.pastedTextAttachments.createLocalFile(sourcePath, label);
  }

  createPastedTextAttachment(content: string, label: string, options: any) {
    return this.pastedTextAttachments.create(content, label, options);
  }

  removePastedTextAttachment(path: string) {
    return this.pastedTextAttachments.remove(path);
  }

  cleanupPendingPastedTextAttachments() {
    return this.pastedTextAttachments.cleanupPendingRemovals();
  }

  // -------------------------------------------------------------------------
  // 列表 / summary
  // -------------------------------------------------------------------------

  isConversationArchiving(conversationId: string) {
    return this.archivingConversationIds.has(conversationId);
  }

  isConversationSuppressedAfterArchive(conversationId: string) {
    return this.threadStore.isConversationSuppressed(conversationId);
  }

  getConversationOrThrow(conversationId: string) {
    let conversation = this.getConversation(conversationId);
    if (!conversation) throw Error(`Conversation not found: ${conversationId}`);
    return conversation;
  }

  get hasFetchedRecentConversations() {
    return this.threadStore.hasFetchedRecentConversations;
  }

  getRecentConversations() {
    return this.threadStore.getRecentConversations();
  }

  getCachedConversations() {
    return this.threadStore.getCachedConversations();
  }

  getSuppressedArchivedConversationIds() {
    return this.threadStore.getSuppressedArchivedConversationIds();
  }

  getHasInProgressLocalConversation({ exceptConversationId }: { exceptConversationId?: string } = {}) {
    for (let conversationId of this.threadStore.getRecentConversationIds()) {
      if (conversationId === exceptConversationId) continue;
      let conversation = this.conversations.get(conversationId);
      if (conversation != null && hasInProgressLocalTurn(conversation)) return true;
    }
    return false;
  }

  setConversation(conversation: any) {
    this.threadStore.setConversation(conversation);
  }

  setThreadStartKind(conversationId: string, kind: string) {
    this.threadStore.setThreadStartKind(conversationId, kind);
  }

  notifyConversationUpdated(conversationId: string) {
    this.threadStore.notifyConversationCallbacks(conversationId);
  }

  async discardConversationFromCache(conversationId: string) {
    await stopEphemeralThread({
      manager: this,
      conversationId,
      stopEphemeralThread:
        this.threadStore.isEphemeralConversation(conversationId) &&
        this.runtime.threadMode(this.hostId) === `durable`,
    });
    this.conversationCacheEvictor.evictConversation(conversationId, { reason: `discard` });
  }

  ensureRecentConversationId(conversationId: string) {
    this.threadStore.ensureRecentConversationId(conversationId);
  }

  suppressArchivedConversation(conversationId: string) {
    this.threadStore.suppressArchivedConversation(conversationId);
  }

  addAnyConversationCallback(callback: any) {
    return this.events.addAnyConversationCallback(callback);
  }

  addAnyConversationMetaCallback(callback: any) {
    return this.events.addAnyConversationMetaCallback(callback);
  }

  getThreadSummaries() {
    return this.threadStore.getThreadSummaries();
  }

  getThreadSummary(conversationId: string) {
    return this.threadStore.getThreadSummary(conversationId);
  }

  getThreadRuntimeStatusEvidence(conversationId: string) {
    return this.threadStore.getThreadRuntimeStatusEvidence(conversationId);
  }

  // -------------------------------------------------------------------------
  // subagent
  // -------------------------------------------------------------------------

  getSubagentDescendantSnapshot(conversationId: string) {
    return this.subagentTopology.getSnapshot(conversationId);
  }

  discoverSubagentDescendantSnapshot(conversationId: string, options?: any) {
    return this.subagentTopology.discover(conversationId, options);
  }

  reconcileSubagentDescendantSnapshot(conversationId: string, snapshot: any) {
    return this.threadStore.reconcileSubagentDescendantSnapshot(conversationId, snapshot);
  }

  activateThreadSummary(conversationId: string, options = {}) {
    this.threadStore.activateThreadSummary(conversationId, options);
  }

  // -------------------------------------------------------------------------
  // 事件订阅
  // -------------------------------------------------------------------------

  addThreadSummariesCallback(callback: any) {
    return this.events.addThreadSummariesCallback(callback);
  }

  addThreadListInvalidatedListener(listener: any) {
    return this.events.addThreadListInvalidatedListener(listener);
  }

  addOpenFileChangeListener(listener: any) {
    return this.events.addOpenFileChangeListener(listener);
  }

  addAcceptedHistoryListener(listener: any) {
    return this.events.addAcceptedHistoryListener(listener);
  }

  acceptConversationHistory(conversationId: string, history: any) {
    this.events.emitAcceptedHistory(conversationId, history);
  }

  addTurnCompletedListener(listener: any) {
    return this.events.addTurnCompletedListener(listener);
  }

  addQueuedMessageExecutionListener(listener: any) {
    return this.events.addQueuedMessageExecutionListener(listener);
  }

  addTurnInterruptStartedListener(listener: any) {
    return this.events.addTurnInterruptStartedListener(listener);
  }

  addTurnSteeredListener(listener: any) {
    return this.events.addTurnSteeredListener(listener);
  }

  emitTurnSteered(conversationId: string) {
    this.events.emitTurnSteered(conversationId);
  }

  addApprovalRequestListener(listener: any) {
    return this.events.addApprovalRequestListener(listener);
  }

  addInitialTitleRequestedListener(listener: any) {
    return this.events.addInitialTitleRequestedListener(listener);
  }

  addRealtimeThreadCreatedListener(listener: any) {
    return this.events.addRealtimeThreadCreatedListener(listener);
  }

  addApprovalResolvedListener(listener: any) {
    return this.events.addApprovalResolvedListener(listener);
  }

  addUserInputRequestListener(listener: any) {
    return this.events.addUserInputRequestListener(listener);
  }

  addThreadArchivedListener(listener: any) {
    return this.events.addThreadArchivedListener(listener);
  }

  addThreadUnarchivedListener(listener: any) {
    return this.events.addThreadUnarchivedListener(listener);
  }

  addThreadDeletedListener(listener: any) {
    return this.events.addThreadDeletedListener(listener);
  }

  addConversationCallback(conversationId: string, callback: any) {
    return this.events.addConversationCallback(conversationId, callback);
  }

  addConversationRemovedListener(listener: any) {
    return this.events.addConversationRemovedListener(listener);
  }

  addConversationHistoryInvalidationListener(listener: any) {
    return ConversationStreamSubscription.subscribe(listener, (callback: any) =>
      this.addConversationStateCallback((conversationId: string, removed: unknown, invalidation: unknown) => {
        callback({ hostId: this.hostId, conversationId, invalidation, removed: removed == null });
      }),
    );
  }

  addConversationStateCallback(callback: any) {
    return this.events.addConversationStateCallback(callback);
  }

  addStreamRoleStateCallback(callback: any) {
    return this.events.addStreamRoleStateCallback(callback);
  }

  addNotificationCallback(methods: string | string[], callback: any) {
    return this.events.addNotificationCallback(methods, callback);
  }

  // -------------------------------------------------------------------------
  // 历史 / 分页
  // -------------------------------------------------------------------------

  async refreshRecentConversations(options = {}) {
    await this.threadStore.refreshRecentConversations(options);
  }

  observeCatalogThreads(options: any) {
    this.threadStore.observeCatalogThreads(options);
  }

  getCachedThreadMetadata(threadIds: string[]) {
    return this.threadStore.getCachedThreadMetadata(threadIds);
  }

  async hydratePinnedThreads(threadIds: string[], options: any) {
    return this.threadStore.hydratePinnedThreads(threadIds, this.handleThreadArchived.bind(this), options);
  }

  async hydrateBackgroundThreads(threadIds: string[], options: any) {
    await this.threadStore.hydrateBackgroundThreads(threadIds, options);
  }

  async hydrateArchivedThreadPreview(conversationId: string) {
    return this.threadStore.hydrateArchivedThreadPreview(
      conversationId,
      this.supportsPaginatedThreadHistory() ? 5 : undefined,
    );
  }

  async loadRecentConversationIds(threadIds: string[]) {
    await this.threadStore.hydrateBackgroundThreads(threadIds);
    return threadIds.filter((threadId) => this.threadStore.getConversation(threadId) != null);
  }

  setPinnedThreadIds(threadIds: string[]) {
    this.threadStore.setPinnedThreadIds(threadIds);
  }

  async listAllThreads({ modelProviders, archived = false }: { modelProviders: unknown; archived?: boolean }) {
    return this.threadStore.listAllThreads({ modelProviders, archived });
  }

  async listArchivedThreads() {
    return this.threadStore.listArchivedThreads();
  }

  async searchThreads({ query, limit }: { query: string; limit: number }) {
    return this.threadStore.searchThreads({ query, limit });
  }

  async readThread(conversationId: string, options = {}) {
    return this.threadStore.readThread(conversationId, options);
  }

  async listThreadTurns(conversationId: string, options = {}) {
    this.assertActive();
    return this.pagination.listThreadTurns(conversationId, options);
  }

  async loadRemainingConversationTurns(conversationId: string) {
    return this.getStreamRole(conversationId)?.role === `follower` &&
      !this.streamState.ownsConversationHistoryStream(conversationId) &&
      !this.isConversationSuppressedAfterArchive(conversationId)
      ? this.ensureConversationHistoryLoaded(conversationId, [], { force: true })
      : this.pagination.loadRemainingConversationTurns(conversationId);
  }

  loadBackgroundThreadHistoryPage(conversationId: string) {
    return this.pagination.loadBackgroundThreadHistoryPage(conversationId, () =>
      this.threadStore.initializeBackgroundThreadHistory(
        conversationId,
        this.hostId === `durable` || this.supportsPaginatedThreadHistory(),
      ),
    );
  }

  async loadRemainingTurnItems(conversationId: string) {
    await this.inFlightConversationResumes.get(conversationId)?.promise;
    return this.pagination.loadRemainingTurnItems(conversationId);
  }

  hasInFlightConversationResume(conversationId: string) {
    return this.inFlightConversationResumes.has(conversationId);
  }

  hasPendingConversationResume() {
    return this.inFlightConversationResumes.size > 0;
  }

  async loadOlderConversationTurnsPage(conversationId: string, options = {}) {
    return this.pagination.loadOlderConversationTurnsPage(conversationId, options);
  }

  async ensureConversationHistoryLoaded(conversationId: string, turns: any[] = [], options = {}) {
    return ensureConversationHistoryLoaded(this, conversationId, turns, options);
  }

  async loadOlderConversationHistoryPage(conversationId: string, turns: any[] = [], options = {}) {
    return loadOlderConversationHistoryPage(this, conversationId, turns, options);
  }

  loadConversationHistoryBoundaryPage(conversationId: string, boundary: any, options = {}) {
    return this.pagination.loadConversationHistoryBoundaryPage(conversationId, boundary, options);
  }

  hydrateConversationSearchMatch(match: any) {
    return hydrateConversationSearchMatch(this, this.history, match);
  }

  supportsThreadTimeline() {
    return (
      this.hostId !== `durable` &&
      versionSupportsFeature(this.requestClient.getAppServerVersion(), `threadTimeline`) &&
      this.settings.history.readThreadTimelineEnabled()
    );
  }

  supportsPaginatedThreadHistory() {
    return (
      this.runtimeSettings.supportsPaginatedThreadHistory?.() ??
      this.requestClient.supportsPaginatedThreadHistory()
    );
  }

  async getCompleteConversationTurns(conversationId: string) {
    return getCompleteConversationTurns(this, conversationId);
  }

  waitForConversationRevision(conversationId: string, ownerClientId: string, revision: number, timeoutMs: number) {
    return this.streamState.waitForConversationRevision(conversationId, ownerClientId, revision, timeoutMs);
  }

  applyRollbackResponseToConversation(entry: any) {
    applyRollbackResponse(this, entry, (turns: any[], truncatedBefore: boolean) => {
      this.acceptConversationHistory(entry.conversationId, {
        replacesExistingHistory: true,
        truncatedBefore,
        turns,
      });
    });
  }

  applyRevertResponseToConversation(entry: any) {
    applyRevertResponse(this, entry, (truncatedBefore: boolean) => {
      this.acceptConversationHistory(entry.conversationId, {
        replacesExistingHistory: true,
        truncatedBefore,
        turns: [],
      });
    });
  }

  // -------------------------------------------------------------------------
  // thread goal
  // -------------------------------------------------------------------------

  async setThreadGoal(conversationId: string, options: any) {
    return resumeRealtimeThreadGoal(this, conversationId, options, this.history);
  }

  async setThreadGoalStatus(conversationId: string, options: any) {
    return setThreadGoalStatus(this, conversationId, options);
  }

  clearThreadGoal(conversationId: string, context: any) {
    let conversation = this.getConversation(conversationId);
    return context != null &&
      (conversation?.threadGoal?.status !== `active` ||
        (context.threadSource != null && conversation.threadSource !== context.threadSource))
      ? Promise.resolve({ cleared: false })
      : this.sendRequest(`thread/goal/clear`, { threadId: conversationId });
  }

  clearThreadGoalResumeConfirmation(conversationId: string) {
    this.updateConversationState(conversationId, (state: any) => {
      state.threadGoalResumeConfirmation = null;
    });
  }

  needsResume(conversationId: string) {
    return this.streamRecovery.needsResume(conversationId);
  }

  getConversationCwd(conversationId: string) {
    return this.conversations.get(conversationId)?.cwd ?? null;
  }

  clearPrewarmedThreads() {
    this.prewarmedThreadManager.discardAllPrewarmedThreads();
  }

  markAllConversationsNeedResumeAfterReconnect(options: any) {
    this.turnStartObservations.clear();
    this.streamRecovery.markAllConversationsNeedResumeAfterReconnect(options);
  }

  async prewarmConversation(params: any, createInputs: any) {
    this.assertActive();
    return this.threadCreation.prewarmConversation(
      {
        ...params,
        workspaceKind: params.workspaceKind ?? `project`,
        defaultFeatureOverrides: this.settings.readDefaultFeatureOverrides(),
        personality: await this.readDefaultPersonality(params.cwd),
      },
      createInputs,
    );
  }

  /** 创建会话 + 首 turn（委托 turn-submission 的 Exe）。 */
  async startConversation(
    params: any,
    {
      readThreadCreationInputs,
      afterConversationCreated,
      beforeFirstTurn,
      onMessageAdded,
      onSettled,
      dynamicToolFeatureOverrides,
      worktreeInit,
    }: any,
  ) {
    return runConversationCreationWithFirstTurn(
      this,
      {
        assertActive: () => this.assertActive(),
        runtimeSettings: this.runtimeSettings,
        threadWorkspaceStorage: this.threadWorkspaceStorage,
        threadStartedNotificationDeferral: this.threadStartedNotificationDeferral,
        threadCreation: this.threadCreation,
        settings: this.settings,
        history: this.history,
        notifyConversationCallbacks: (conversationId: string) => this.threadStore.notifyConversationCallbacks(conversationId),
        executeTurnStart: this.executeTurnStart.bind(this),
      },
      params,
      {
        readThreadCreationInputs,
        afterConversationCreated,
        beforeFirstTurn,
        onMessageAdded,
        onSettled,
        dynamicToolFeatureOverrides,
        worktreeInit,
      },
    );
  }

  // -------------------------------------------------------------------------
  // fork
  // -------------------------------------------------------------------------

  async forkConversationFromLatest(params: any) {
    this.activateThreadSummary(params.sourceConversationId);
    let result = await forkConversation({
      beforeConversationAdded: params.afterConversationCreated,
      capabilities: this.getForkCapabilities(),
      history: this.history,
      hostMode: this.runtime.threadMode(this.hostId),
      compareSemanticVersions,
      threadRecognition: this.threadRecognition,
      manager: this,
      notificationDeferral: this.threadStartedNotificationDeferral,
      params,
      saveThreadProjectAssignment: this.runtimeSettings.saveThreadProjectAssignment,
      workspaceStorage: this.threadWorkspaceStorage,
    });
    return result.status === `not-ready`
      ? result
      : adoptForkedConversation({
          manager: this,
          projectlessConversations: this.projectlessConversations,
          result,
          params,
        });
  }

  async finishPullRequestFixForkSetup(params: any) {
    let { thread } = await this.sendRequest(`thread/read`, {
      threadId: params.conversationId,
      includeTurns: false,
    });
    if (
      thread.id !== params.conversationId ||
      thread.ephemeral ||
      thread.threadSource !== `pull_request_fix_automation` ||
      thread.forkedFromId == null ||
      (params.sourceConversationId != null && thread.forkedFromId !== params.sourceConversationId)
    )
      return { status: `refused`, reason: `not-automatic-fix-fork` };
    let sourceConversationId = normalizeThreadId(thread.forkedFromId);
    let forkParams = {
      sourceConversationId,
      cwd: thread.cwd,
      workspaceRoots: [thread.cwd],
      addForkedFromSyntheticItem: false,
    };
    let product = createForkProduct(this, forkParams, this.getForkCapabilities(), this.history);
    try {
      let placement = await product.prepareRequest();
      if (placement.status === `not-ready`) return placement;
      product.copyThreadMetadata(sourceConversationId, params.conversationId);
      let projectAssignment = await this.getThreadProjectAssignment(sourceConversationId);
      let synchronization = await synchronizeForkedThread({
        conversationId: params.conversationId,
        product,
        resumeParams: {
          conversationId: params.conversationId,
          model: null,
          reasoningEffort: null,
          workspaceRoots: [thread.cwd],
          collaborationMode: null,
        },
        projectAssignment,
        placement,
        saveThreadProjectAssignment: this.runtimeSettings.saveThreadProjectAssignment,
        workspaceStorage: this.threadWorkspaceStorage,
      });
      return await adoptForkedConversation({
        manager: this,
        projectlessConversations: this.projectlessConversations,
        result: {
          status: `created`,
          conversationId: params.conversationId,
          synchronization,
          projectAssignment,
          sourceConversation: this.getConversation(sourceConversationId),
        },
        params: forkParams,
      });
    } finally {
      product.trace?.finish();
    }
  }

  addForkedFromConversationSyntheticItem(conversationId: string, sourceConversationId: string, options: any) {
    addForkedFromConversationSyntheticItem(this, conversationId, sourceConversationId, options, this.history);
  }

  async forkConversationFromTurn(params: any) {
    let sourceConversation = this.getConversation(params.sourceConversationId);
    if (sourceConversation == null) throw Error(`Source conversation not found.`);
    sourceConversation.historyMode !== `paginated` &&
      (await this.ensureConversationHistoryLoaded(params.sourceConversationId, [], { force: true }));
    return forkConversationFromTurn(this, params, compareSemanticVersions);
  }

  // -------------------------------------------------------------------------
  // 停止 / 中断 / 压缩
  // -------------------------------------------------------------------------

  stopThread(conversationId: string, initiatedBy: string) {
    this.assertActive();
    return stopConversation({
      conversationId,
      initiatedBy,
      isDurableHost: this.runtime.threadMode(this.getHostId()) === `durable`,
      isMcpMethodNotFoundError,
      manager: this,
    });
  }

  updateThreadDaybreakEnabled(conversationId: string, daybreakEnabled: boolean) {
    return this.runThreadSettingsUpdate(conversationId, async () => {
      if (this.threadStore.isEphemeralConversation(conversationId)) {
        let before = this.getConversation(conversationId);
        ((await this.sendThreadFollowerRequest(
          this.getStreamRole(conversationId),
          `thread-follower-update-daybreak`,
          { conversationId, daybreakEnabled },
        )) == null ||
          this.getConversation(conversationId) === before) &&
          this.threadStore.applyThreadDaybreakUpdate(conversationId, daybreakEnabled);
        return;
      }
      let { thread } = await this.sendRequest(`thread/metadata/update`, {
        threadId: conversationId,
        daybreakEnabled,
      });
      this.threadStore.applyThreadDaybreakUpdate(conversationId, thread.daybreakEnabled);
    });
  }

  async updateThreadGitBranch(conversationId: string, branch: string) {
    await this.sendRequest(`thread/metadata/update`, { threadId: conversationId, gitInfo: { branch } });
    this.updateConversationState(conversationId, (state: any) => {
      state.gitInfo = {
        branch,
        sha: state.gitInfo?.sha ?? null,
        originUrl: state.gitInfo?.originUrl ?? null,
      };
    });
  }

  retrySafetyBufferedTurn(conversationId: string, turnId: string, model: string, options: any = {}) {
    return retrySafetyBufferedTurn({
      conversationId,
      manager: this,
      model,
      additionalContext: options.additionalContext,
      startTurn: (request: any, bufferedTurn: any) =>
        this.executeTurnStart(conversationId, {
          request,
          context: {
            attachments: bufferedTurn.params.attachments,
            commentAttachments: bufferedTurn.params.commentAttachments,
            useAppServerPermissionDefault: bufferedTurn.params.useAppServerPermissionDefault,
            inheritThreadSettings: false,
            writingBlockContextPrepared: options.writingBlockContextPrepared,
          },
        }),
      turnId,
      turnMergePolicy: this.history.turnMergePolicy,
    });
  }

  async interruptConversation(conversationId: string, mode = `system`, expectedTurnId?: string) {
    let result = null;
    try {
      return ((result = await this.interruptConversationSelf(conversationId, mode, expectedTurnId)), result);
    } finally {
      (expectedTurnId == null || result != null) &&
        mode !== `descendant-cleanup` &&
        this.getStreamRole(conversationId)?.role !== `follower` &&
        (mode === `user-stop`
          ? this.interruptSubagentDescendantsInBackground(conversationId)
          : await this.interruptSubagentDescendants(conversationId));
    }
  }

  async interruptSubagentDescendants(conversationId: string) {
    await interruptSubagentDescendants({
      logger: this.logger,
      conversationId,
      conversations: this.conversations,
      discoverDescendantSnapshot: () => this.discoverSubagentDescendantSnapshot(conversationId),
      getDescendantSnapshot: () => this.getSubagentDescendantSnapshot(conversationId),
      interruptConversationSelf: (id: string) => this.interruptConversation(id, `descendant-cleanup`),
      interruptTurn: async (id: string, turnId: string) => {
        await this.sendRequest(`turn/interrupt`, { threadId: id, turnId });
      },
      listThreadTurns: (id: string) =>
        this.listThreadTurns(id, { itemsView: `notLoaded`, limit: 1 }).then(({ response }: any) => response),
    });
  }

  interruptSubagentDescendantsInBackground(conversationId: string) {
    this.scheduler.schedule(() => {
      this.interruptSubagentDescendants(conversationId).catch((error: unknown) => {
        this.logger.warning(`Failed to interrupt subagent descendants`, {
          safe: { conversationId },
          sensitive: { error },
        });
      });
    }, 0);
  }

  async compactThread(conversationId: string) {
    await compactThreadViaFollower(this, conversationId, {
      ownerWindowError: OWNER_WINDOW_ERROR,
      markConversationNeedsResumeForUnavailableOwner: (id: string, ownerClientId: string) => {
        this.markConversationNeedsResumeForUnavailableOwner(id, ownerClientId);
      },
      registerPendingManualContextCompaction: (id: string) => {
        this.registerPendingManualContextCompaction(id);
      },
      removePendingManualContextCompaction: (id: string) => {
        this.removePendingManualContextCompaction(id);
      },
      resumeConversationForUnavailableOwner: (request: any) => this.resumeConversationForUnavailableOwner(request),
      sendThreadFollowerRequest: (role: any, method: string, params: any) => this.sendThreadFollowerRequest(role, method, params),
    });
  }

  /** 中断核心（原 interruptConversationSelf）：follower 委托优先，owner 失联
   *  回退本地；活跃 goal 先/后暂停（按中断来源）。 */
  async interruptConversationSelf(conversationId: string, mode: string, expectedTurnId?: string) {
    let role = this.getStreamRole(conversationId);
    try {
      let followerResult = await this.sendThreadFollowerRequest(role, `thread-follower-interrupt-turn`, {
        conversationId,
        mode,
        expectedTurnId,
      });
      if (followerResult) {
        let { goalPauseError, interruptedTurnId } = followerResult;
        if (goalPauseError != null) throw Object.assign(Error(goalPauseError), { interruptedTurnId });
        return interruptedTurnId;
      }
    } catch (error) {
      let message = errorToString(error).toLowerCase();
      let recoverableReason = [`timeout`, `request-version-mismatch`, `no-client-found`].find((reason) =>
        message.includes(reason),
      );
      if (role?.role !== `follower` || recoverableReason == null) throw error;
      this.markConversationNeedsResumeForUnavailableOwner(conversationId, role.ownerClientId);
      this.logger.warning(`Falling back to local interrupt after follower owner became unavailable`, {
        safe: { conversationId, reason: recoverableReason },
        sensitive: {},
      });
    }
    let runLocalInterrupt = () =>
      interruptConversationCore({
        logger: this.logger,
        backgroundCleanup: mode === `user-stop` && expectedTurnId == null,
        killNodeReplExecutions: (threadId: string, turnId: string) => this.runtime.killNodeReplExecutions(threadId, turnId),
        onTurnInterruptStarted: () => this.events.emitTurnInterruptStarted(conversationId),
        schedule: this.scheduler.schedule,
        cleanBackgroundTerminals: () => this.cleanBackgroundTerminals(conversationId),
        conversationId,
        conversationState: this.conversations.get(conversationId),
        expectedTurnId,
        sendInterruptRequest: (threadId: string, turnId: string) =>
          this.sendRequest(`turn/interrupt`, { threadId, turnId }),
        updateConversationState: (id: string, updater: any) => this.updateConversationState(id, updater),
      });
    if (expectedTurnId != null) return runLocalInterrupt();
    let hasActiveGoal = this.getConversation(conversationId)?.threadGoal?.status === `active`;
    let pauseGoal = async (options?: any) => {
      let { goal } = await this.sendRequest(`thread/goal/set`, { threadId: conversationId, status: `paused` }, options);
      this.updateConversationState(conversationId, (state: any) => {
        state.threadGoal = goal;
        state.threadGoalResumeConfirmation = null;
      });
    };
    let goalPauseError: unknown;
    if (hasActiveGoal && mode === `system`) await pauseGoal();
    else if (hasActiveGoal && mode === `user-stop`) {
      try {
        await pauseGoal({ priority: `critical`, timeoutMs: 500 });
      } catch (error) {
        goalPauseError = error;
        this.logger.warning(`Failed to pause thread goal before interrupt`, {
          safe: { conversationId },
          sensitive: { error },
        });
      }
    }
    markInterruptedCommandExecutions(this, buildInterruptResponse, conversationId, this.conversations.get(conversationId));
    let interruptedTurnId = await runLocalInterrupt();
    if (hasActiveGoal && mode === `descendant-cleanup`) {
      try {
        await pauseGoal();
      } catch (error) {
        this.logger.warning(`Failed to pause thread goal after interrupt`, {
          safe: { conversationId },
          sensitive: { error },
        });
      }
    }
    if (goalPauseError != null)
      throw Object.assign(Error(`Failed to pause thread goal`, { cause: goalPauseError }), {
        interruptedTurnId,
      });
    return interruptedTurnId;
  }

  async cleanBackgroundTerminals(conversationId: string, options?: any) {
    let role = this.getStreamRole(conversationId);
    if (!options?.allowOverlayDirect && role?.role === `follower`) throw Error(OWNER_WINDOW_ERROR);
    let conversation = this.conversations.get(conversationId);
    await this.sendRequest(`thread/backgroundTerminals/clean`, { threadId: conversation?.id ?? conversationId });
    this.updateConversationState(conversationId, markInterruptedCommandExecutionsInPlace, false);
  }

  // -------------------------------------------------------------------------
  // 归档
  // -------------------------------------------------------------------------

  archiveContext(useAppServerPins: boolean) {
    return archiveContextFactory({
      useAppServerPins,
      appServerVersion: this.requestClient.getAppServerVersion(),
      threadStore: this.threadStore,
      projectlessState: this.projectlessConversations,
      storage: this.storage,
      archivingConversationIds: this.archivingConversationIds,
      archivedPinnedThreadPlacements: this.archivedPinnedThreadPlacements,
      runtime: this.runtime,
      isLocalHost: (hostId: string) => hostId === `local`,
      worktreeRoots: this.filesystem,
      pendingThreadArchives: this.pendingThreadArchives,
      ipcBridge: this.ipcBridge,
      inactiveThreadUnsubscriber: this.inactiveThreadUnsubscriber,
      manager: this,
      events: this.events,
      conversationCacheEvictor: this.conversationCacheEvictor,
    });
  }

  async archiveConversation(conversationId: string, options: any) {
    await archiveConversation(this.archiveContext(options.useAppServerPins), conversationId, options);
  }

  async discardConversationIfEmpty(conversationId: string) {
    if (completeHistoryTurns(this.conversations.get(conversationId) as never)?.length !== 0) return false;
    this.conversationCacheEvictor.evictConversation(conversationId, { reason: `empty-thread` });
    try {
      await this.sendRequest(`thread/unsubscribe`, { threadId: conversationId });
    } catch (error) {
      this.logger.warning(`Failed to unsubscribe discarded empty conversation`, {
        safe: { conversationId },
        sensitive: { error },
      });
    }
    return true;
  }

  async unsubscribeInactiveConversation(conversationId: string) {
    await this.inactiveThreadUnsubscriber.unsubscribeInactiveConversation(conversationId);
  }

  async unarchiveConversation(conversationId: string, options: any) {
    await unarchiveConversation(this.archiveContext(options.useAppServerPins), conversationId, options.restorePin ?? false);
  }

  async deleteArchivedConversation(conversationId: string) {
    return deleteArchivedConversation(
      {
        hostId: this.hostId,
        runtime: this.runtime,
        handleThreadDeletion: this.handleThreadDeletion.bind(this),
      },
      conversationId,
    );
  }

  async deleteAllArchivedConversations() {
    return deleteArchivedConversation({
      hostId: this.hostId,
      runtime: this.runtime,
      handleThreadDeletion: this.handleThreadDeletion.bind(this),
    });
  }

  performArchiveConversation(conversationId: string, options: any, archiveOptions: any) {
    return performArchiveConversation(this.archiveContext(archiveOptions.useAppServerPins), conversationId, options, archiveOptions);
  }

  // -------------------------------------------------------------------------
  // 认证（lifecycle 委托）
  // -------------------------------------------------------------------------

  loginWithApiKey(apiKey: string) {
    return this.lifecycle.loginWithApiKey(apiKey);
  }

  createChatGptLoginSession(options = {}) {
    let controller = this.runtime.createAbortController();
    return new LoginOperationHandle(this.loginWithChatGPT(controller, options), controller);
  }

  createChatGptDeviceCodeLoginSession() {
    let controller = this.runtime.createAbortController();
    return new LoginOperationHandle(this.loginWithChatGPTDeviceCode(controller), controller);
  }

  createWindowsSandboxSetupSession(email: string, options: any) {
    return new AppServerOperationHandle(this.startWindowsSandboxSetup(email, options));
  }

  loginWithChatGPT(controller: any, options = {}) {
    return this.lifecycle.loginWithChatGPT(controller, options);
  }

  loginWithChatGPTDeviceCode(controller: any) {
    return this.lifecycle.loginWithChatGPTDeviceCode(controller);
  }

  async startWindowsSandboxSetup(email: string, options: any) {
    return this.lifecycle.startWindowsSandboxSetup(email, options);
  }

  async logout() {
    await this.sendRequest(`account/logout`, undefined);
  }

  logoutWithoutServer() {
    this.turnStartObservations.clear();
    this.lifecycle.logoutWithoutServer();
  }

  async getAccount(options: any) {
    return this.sendRequest(`account/read`, { refreshToken: false }, options);
  }

  async getAuthMethod(options: any) {
    let { authMethod } = await this.sendRequest(`getAuthStatus`, { includeToken: false, refreshToken: false }, options);
    return authMethod;
  }

  // -------------------------------------------------------------------------
  // 配置 / MCP
  // -------------------------------------------------------------------------

  setDefaultServiceTierConfig(conversationId: string, serviceTier: unknown) {
    return this.defaultTurnConfig.writeServiceTier(conversationId, serviceTier);
  }

  listMcpServers(originator: string, options: any) {
    return listMcpServers(this, this.mcpServerStatusPromises, originator, options);
  }

  callMcpTool(request: any, options: any) {
    let meta = request._meta != null && typeof request._meta == `object` && !Array.isArray(request._meta) ? request._meta : {};
    return this.sendRequest(
      `mcpServer/tool/call`,
      {
        ...request,
        _meta: request.threadId == null ? request._meta : { ...meta, thread_id: request.threadId, threadId: request.threadId },
      },
      options,
    );
  }

  setDefaultModelConfig(conversationId: string, model: string, options: any) {
    return this.defaultTurnConfig.writeModel(conversationId, model, options);
  }

  // -------------------------------------------------------------------------
  // 通知 / 服务端请求
  // -------------------------------------------------------------------------

  onNotification(method: string, params: any, automationCapability: unknown = null, shouldIgnore?: boolean) {
    this.assertActive();
    if (this.threadExecution == null) throw Error(`App-server manager thread execution is not attached`);
    (method === `account/updated` || method === `account/login/completed`) &&
      (this.pagination.resetAfterReconnect(), this.turnStartObservations.clear());
    applyNotification(this.notificationReductionContext, method, params, automationCapability, shouldIgnore);
  }

  onRequest(request: any) {
    this.assertActive();
    if (this.threadExecution == null) throw Error(`App-server manager thread execution is not attached`);
    let { id, method, params } = request;
    method === `item/tool/call` && this.getConversation(normalizeThreadId(params.threadId));
    let canHandleAeonDynamicToolAsFollower =
      method === `item/tool/call` &&
      this.streamState.getStreamRole(normalizeThreadId(params.threadId))?.role === `follower` &&
      false;
    (canHandleAeonDynamicToolAsFollower || !this.streamState.shouldIgnoreThreadMutationAsFollower(method, params, `request`)) &&
      (method === `currentTime/read` ||
        (!this.resumeNotificationBuffer.bufferRequest(request) &&
          !this.threadStartedNotificationDeferral.bufferRequest(request))) &&
      (this.logger.debug(`Received server request`, {
        safe: {},
        sensitive: { id, method, params },
      }),
      handleServerRequest({
        manager: this,
        serverRequest: request,
        canHandleAeonDynamicToolAsFollower,
        threadExecution: this.threadExecution,
        runtimeSettings: this.runtimeSettings,
        runtime: this.runtime,
        turnMergePolicy: this.history.turnMergePolicy,
        respond: this.sendAppServerResponse,
        onApprovalRequest: (event: any) => this.events.emitApprovalRequest(event),
        onUserInputRequest: (event: any) => this.events.emitUserInputRequest(event),
        shouldHandleDynamicToolCall: (request: any) => this.streamState.shouldHandleDynamicToolCall(request),
        resumeForFileApproval: (conversationId: string) => {
          resumeSubagentForFileApproval({
            conversationId,
            manager: this,
            resumeConversation: (request: any) => this.#resumeConversation(request, `executor`),
            shouldHandleFailure: () =>
              !this.disposed &&
              !this.inFlightConversationResumes.has(conversationId) &&
              this.getConversation(conversationId)?.resumeState === `needs_resume`,
          }).catch(() => {});
        },
      }));
  }

  // -------------------------------------------------------------------------
  // 审批决策回执（R3 approval-review 的回执侧）
  // -------------------------------------------------------------------------

  getApprovalActionContext() {
    this.assertActive();
    return buildApprovalActionContext({
      logger: this.logger,
      hostId: this.hostId,
      approvalResolved: (conversationId: string, requestId: string) =>
        this.events.emitApprovalResolved({ conversationId, requestId }),
      ipcBridge: this.ipcBridge,
      parseUrl: this.runtime.parseUrl,
      dispatchAppServerResponse: this.sendAppServerResponse,
      getStreamRole: this.getStreamRole.bind(this),
      conversations: this.conversations,
      updateConversationState: this.updateConversationState.bind(this),
    });
  }

  replyWithCommandExecutionApprovalDecision(requestId: string, decision: any, options: any) {
    replyWithCommandExecutionApprovalDecision(this.getApprovalActionContext(), requestId, decision, options);
  }

  replyWithFileChangeApprovalDecision(requestId: string, decision: any, options: any) {
    replyWithFileChangeApprovalDecision(this.getApprovalActionContext(), requestId, decision, options);
  }

  replyWithPermissionsRequestApprovalResponse(requestId: string, decision: any, options: any) {
    replyWithPermissionsRequestApprovalResponse(this.getApprovalActionContext(), requestId, decision, options);
  }

  replyWithUserInputResponse(requestId: string, response: any, options: any) {
    (this.getStreamRole(options?.conversationId ?? requestId)?.role !== `follower` &&
      this.replyWithDynamicToolResponse(requestId, response, (request: any) =>
        request.tool === `request_onboarding_input` || request.tool === `request_environment_input`
          ? buildOnboardingToolResponse(options)
          : null,
      )) ||
      replyWithUserInputResponse(this.getApprovalActionContext(), requestId, response, options);
  }

  replyWithOptionPickerResponse(requestId: string, response: any, options: any) {
    replyWithOptionPickerResponse(this, this.sendAppServerResponse, requestId, response, options);
  }

  getDynamicToolRequest(conversationId: string, requestId: string) {
    return getDynamicToolRequest(this, conversationId, requestId);
  }

  removePendingDynamicToolRequest(conversationId: string, requestId: string) {
    removePendingDynamicToolRequest(this, this.resumeNotificationBuffer, this.threadStartedNotificationDeferral, conversationId, requestId);
  }

  replyWithDynamicToolResponse(requestId: string, response: any, options: any) {
    return replyWithDynamicToolResponse(this, this.sendAppServerResponse, requestId, response, options);
  }

  beginUserVerification(conversationId: string, requestId: string, host: any) {
    return beginUserVerification({
      context: this.getApprovalActionContext(),
      approvals: this.userVerificationApprovals,
      isActive: () => !this.disposed,
      host,
      conversationId,
      requestId,
      manager: this,
    });
  }

  replyWithMcpServerElicitationResponse(requestId: string, response: any, options: any) {
    replyWithMcpServerElicitationResponse(this.getApprovalActionContext(), requestId, response, options);
  }

  // -------------------------------------------------------------------------
  // 请求派发 / settings
  // -------------------------------------------------------------------------

  async sendRequest(method: string, params: any, options?: any) {
    this.assertActive();
    return this.requestClient.sendRequest(method, params, options);
  }

  async sendThreadFollowerRequest(role: any, method: string, params: any, options?: any) {
    this.assertActive();
    if (
      role?.role !== `follower` ||
      (method === `thread-follower-load-complete-history` && this.streamState.ownsConversationHistoryStream(params.conversationId))
    )
      return null;
    if (this.ipcBridge == null) throw Error(`client-coordination-service-unavailable`);
    let response = await this.ipcBridge.request(method, params, {
      targetClientId: role.ownerClientId,
      timeoutMs: options?.timeoutMs,
    });
    if (response.resultType === `error`) throw Error(response.error);
    return response.result;
  }

  updateThreadSettingsForNextTurn(conversationId: string, settings: any, condition: any) {
    return this.updateThreadSettings(conversationId, settings, undefined, condition);
  }

  async updateThreadPermissions(conversationId: string, permissions: any, currentActiveTurnId?: string) {
    await this.updateThreadSettings(
      conversationId,
      permissions,
      currentActiveTurnId ?? activeTurnId(this.getConversation(conversationId)),
    );
  }

  /** settings 更新（原 updateThreadSettings）：follower 委托 → 条件判定 →
   *  thread/settings/update（不支持时本地应用）→ turn 级 approvalsReviewer。 */
  updateThreadSettings(conversationId: string, settings: any, activeTurnId?: string | null, condition?: any) {
    return this.runThreadSettingsUpdate(conversationId, async () => {
      let conversation = this.getConversation(conversationId);
      let previousSettings = conversation?.latestThreadSettings;
      let followerResult = await delegateRequestToFollowerOwner({
        conversationId,
        getStreamRole: (id: string) => this.getStreamRole(id),
        markConversationNeedsResumeForUnavailableOwner: (id: string, ownerClientId: string) => {
          this.markConversationNeedsResumeForUnavailableOwner(id, ownerClientId);
        },
        resumeConversationForUnavailableOwner: (request: any) => this.resumeConversationForUnavailableOwner(request),
        workspaceRoots: [this.getConversationCwd(conversationId) ?? `/`],
        collaborationMode: conversation?.latestCollaborationMode ?? null,
        reasoningEffort: conversation?.latestReasoningEffort ?? null,
        serviceTier: settings.serviceTier,
        sendRequest: (followerRequest: any) =>
          this.sendThreadFollowerRequest(followerRequest, `thread-follower-update-thread-settings`, {
            conversationId,
            threadSettings: settings,
            activeTurnId,
            condition,
          }),
      });
      if (followerResult != null) {
        followerResult.applied &&
          this.getConversation(conversationId)?.latestThreadSettings === previousSettings &&
          this.updateConversationState(conversationId, (state: any) => {
            applyThreadSettingsUpdate(state, settings);
          });
        return followerResult.applied;
      }
      let current = this.getConversation(conversationId);
      let settingsBefore = current?.latestThreadSettings;
      if (
        condition != null &&
        (current?.latestReasoningEffort !== condition.ifEffortEquals ||
          (condition.ifModelEquals != null && current?.latestModel !== condition.ifModelEquals))
      )
        return false;
      if (this.threadSettingsUpdateSupport !== `unsupported`) {
        try {
          await this.sendRequest(`thread/settings/update`, { threadId: conversationId, ...settings });
          this.threadSettingsUpdateSupport = `supported`;
        } catch (error) {
          if (!isMcpMethodNotFoundError(error, `thread/settings/update`)) throw error;
          this.threadSettingsUpdateSupport = `unsupported`;
        }
      }
      return (
        (this.threadSettingsUpdateSupport === `unsupported` ||
          this.getConversation(conversationId)?.latestThreadSettings === settingsBefore) &&
          this.updateConversationState(conversationId, (state: any) => {
            applyThreadSettingsUpdate(state, settings);
          }),
        await updateApprovalsReviewerForTurn(this, conversationId, settings, activeTurnId ?? null),
        true
      );
    });
  }

  /** settings 更新串行化（按会话一条链）。 */
  async runThreadSettingsUpdate(conversationId: string, operation: () => Promise<unknown>) {
    return this.pendingThreadSettingsUpdates.run(conversationId, operation);
  }

  async waitForPendingThreadSettingsUpdate(conversationId: string) {
    await this.pendingThreadSettingsUpdates.wait(conversationId);
  }

  getForkCapabilities() {
    return buildForkCapabilities({
      hostId: this.hostId,
      appServerVersion: this.requestClient.getAppServerVersion(),
      runtime: this.runtime,
      settings: this.settings,
      storage: this.storage,
      beginTrace: this.tracing.beginFork,
      isActive: () => !this.disposed,
    });
  }

  readShellEnvironmentPolicy(conversationId: string, options: any) {
    return this.defaultTurnConfig.readShellEnvironmentPolicy(conversationId, options);
  }

  // -------------------------------------------------------------------------
  // 状态更新 / open files / 指标 / 窗口活动
  // -------------------------------------------------------------------------

  updateConversationState(conversationId: string, updater: (state: any) => void, broadcastPatchesToFollowers = true) {
    let before = this.getConversation(conversationId);
    this.threadStore.updateConversationState(conversationId, updater, { broadcastPatchesToFollowers });
    let after = this.getConversation(conversationId);
    if (after != null && before?.hasUnreadTurn !== after.hasUnreadTurn)
      this.saveReadState(conversationId, after.hasUnreadTurn, `turn`);
  }

  setOpenReviewFileSourceTabs(conversationId: string, files: any) {
    this.openFileWatches.setOpenReviewFileSourceFiles(conversationId, files);
  }

  setOpenFileTabs(conversationId: string, files: any) {
    this.openFileWatches.setOpenFileTabFiles(conversationId, files);
  }

  ignoreOpenFileChangeEvents(conversationId: string, ignore: boolean) {
    this.openFileWatches.ignoreFileChangeEvents(conversationId, ignore);
  }

  async setOpenMcpResources(conversationId: string, resources: any, options: any) {
    await this.openFileWatches.setOpenMcpResources(conversationId, resources, options);
  }

  collectAppStateMetrics(reviewPaneSnapshotMetrics: any) {
    return {
      stream: this.streamState.collectSnapshotFields(),
      ...collectConversationMetrics({
        conversations: this.conversations,
        recentConversationIds: this.threadStore.getRecentConversationIds(),
        streamingConversations: this.streamState.getStreamingConversations(),
        getStreamRole: (conversationId: string) => this.streamState.getStreamRole(conversationId),
        pendingRequestCount: this.requestClient.getPendingRequestCount(),
        reviewPaneSnapshotMetrics,
      }),
    };
  }

  broadcastConversationSnapshot(conversationId: string) {
    return this.streamState.broadcastConversationSnapshot(conversationId);
  }

  setConversationStreamRole(conversationId: string, role: any) {
    this.streamState.setConversationStreamRole(conversationId, role);
  }

  registerWindowActivity(activity: any) {
    this.assertActive();
    return this.streamState.registerWindowActivity(activity, () => this.turnCoordinator.executionChanged());
  }

  getWindowActivity() {
    return this.streamState.getWindowActivity();
  }

  retainActiveConversation(conversationId: string) {
    this.assertActive();
    return new DisposableHandle(
      this.threadStore.retainActiveConversation(conversationId, (active: boolean) => {
        this.inactiveThreadUnsubscriber.handleConversationActivityChanged(conversationId, active);
        this.streamState.setConversationFollowing(conversationId, active);
      }),
    );
  }

  // -------------------------------------------------------------------------
  // 归档/删除通知 / 未读
  // -------------------------------------------------------------------------

  handleThreadArchived(conversationId: string) {
    this.events.emitThreadListInvalidated();
    this.conversationCacheEvictor.evictConversation(conversationId, { reason: `archive-notification` });
  }

  async handleThreadUnarchived(conversationId: string) {
    this.events.emitThreadListInvalidated();
    this.threadStore.unsuppressArchivedConversation(conversationId);
    this.events.emitThreadUnarchived(conversationId);
    if (this.threadStore.isCatalogHistoryEnabled) {
      let { thread } = await this.readThread(conversationId, { includeTurns: false });
      this.threadStore.upsertConversationFromThread(thread, `stored`);
      return;
    }
    await this.refreshRecentConversations({ mode: `expanded` });
  }

  handleThreadDeletion(threadIds: string[]) {
    if (threadIds.length !== 0) {
      this.events.emitThreadListInvalidated();
      for (let threadId of threadIds) {
        let conversationId = normalizeThreadId(threadId);
        this.conversationCacheEvictor.evictConversation(conversationId, { reason: `delete` });
        this.events.emitThreadDeleted(conversationId);
      }
    }
  }

  markConversationAsRead(conversationId: string) {
    this.setConversationUnreadState(conversationId, false);
  }

  markConversationAsUnread(conversationId: string) {
    this.setConversationUnreadState(conversationId, true);
  }

  setConversationUnreadState(conversationId: string, hasUnreadTurn: boolean) {
    let wasUnread = this.readState.has(conversationId);
    (this.applySavedConversationReadState(conversationId, hasUnreadTurn) || wasUnread !== hasUnreadTurn) &&
      this.saveReadState(conversationId, hasUnreadTurn);
  }

  saveReadState(conversationId: string, hasUnreadTurn: boolean, source?: string) {
    let previous = this.ownReadChange;
    this.ownReadChange = { threadId: conversationId, hasUnreadTurn };
    try {
      this.readState.set(conversationId, hasUnreadTurn, source);
    } finally {
      this.ownReadChange = previous;
    }
  }

  applySavedConversationReadState(conversationId: string, hasUnreadTurn: boolean) {
    this.unread.setConversationUnreadState(conversationId, hasUnreadTurn);
    return this.threadStore.applySavedConversationReadState(conversationId, hasUnreadTurn);
  }

}
