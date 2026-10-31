// app-server host 装配层：请求路由 / 请求发送器 / host 上下文 / 执行配置 /
// 存储桥。
//
// 对应 main-C-Mhak1n.ts 63,937-64,778（+catalog 订阅 64,779-64,913）：
//   - IT DynamicAppToolPendingResponses（64,022-64,054）
//   - xEe HostRequestRouter（64,058-64,187）：server/native 双源请求登记、
//     重连清理、thread 删除级联取消、动态 app 工具的交互调用
//   - SEe/CEe host 上下文（64,188-64,260）：worktree 候选去重、附件编解码、
//     初始化面、可视化根、受限任务根、open-file-watch 路径归一
//   - wEe createHostThreadReadState（64,261-64,366）：闭包状态机——
//     open 代数计数、retired 重试、unread 集合增量
//   - EEe AppServerRequestSender（64,368-64,480）：prewarm/超时 abandon/
//     生命周期监听
//   - DEe createHostServices（64,481-64,554）：queuedMessages 锁、端口转发、
//     node-repl kill、归档、pinned threads
//   - prompt 限额 schema（RT/zT/BT/OEe/kEe，64,556-64,594）：64KiB 上限
//   - AEe readExecutionSettings（64,595-64,615）
//   - jEe createHostExecutionConfig（64,616-64,711）
//   - NEe createHostStorage（64,713-64,778）：persisted-atom 读写 + 广播、
//     白名单 globalState 更新、QUEUED_FOLLOW_UPS
//   - PEe subscribeCatalogThreads（64,779-64,792）
//
// FEe（createHostedAppServerManager，64,793+）依赖 R4 的 AppServerConversationManager
// （rw），待其交付后在集成阶段落地。
import { randomUUID } from "node:crypto";
import { posix, win32 } from "node:path";
import {
  wf as objectSchema,
  Of as stringSchema,
  df as enumSchema,
  Ec as dynamicAppToolResultSchema,
  Ef as recordSchema,
  $u as threadIdOf,
  ed as requestIdOf,
  ls as isNotificationMethod,
  or as requestErrorOf,
  Ku as supportsPaginatedHistory,
  Gu as supportsRecencySortKey,
  vl as isAbsolutePathLike,
  Xa as normalizeWorktreeRoot,
  qi as visualizationIdOf,
  Cl as joinPath,
  Sl as joinHostPath,
  Tl as normalizeSlashes,
  Ol as stripDrivePrefix,
  El as stripCygdrivePrefix,
  bl as isWindowsPath,
  xl as isUncPath,
  wl as normalizeUncPath,
  pu as MAX_DIRECT_TRANSFER_BYTES,
  k as killNodeReplExecution,
  sr as parseUrl,
  ga as archiveUndoDurationMs,
  tc as composeFeatureOverrides,
  Ca as normalizeThreadOrders,
  iu as STATE_KEYS,
  Fa as settingsGroup,
  Pa as defaultModeSettings,
  ja as conversationDetailSettings,
} from "@chunk/shared";
import { createTaggedLogger, memoizedTaggedLogger } from "@chunk/logger";
import { getDesktopFeatureAvailability } from "../misc/availability";
import { J as PERSISTED_ATOM_STATE_KEY } from "@chunk/bootstrap";
import { isSameAuthIdentity } from "../api/desktop-fetch";
import { createHostThreadReadState as createHostThreadReadStateController } from "../conversation/thread-read-state-controller";
import { DynamicAppToolPendingResponses } from "./dynamic-app-tool-pending-responses";
import { runAppServerRequestLifecycle } from "../conversation/app-server-request-lifecycle-controller";
import { AppServerConversationManager } from "../conversation/app-server-manager";
import { createThreadStreamBroadcastHandlers } from "./cloud-backend";

const createHostThreadReadState = (
  dependencies: Omit<
    Parameters<typeof createHostThreadReadStateController>[0],
    "isSameAuthIdentity"
  >,
) =>
  createHostThreadReadStateController({ ...dependencies, isSameAuthIdentity });

// ---------------------------------------------------------------------------
// HostRequestRouter（原 `xEe`）
// ---------------------------------------------------------------------------

interface HostConnectionLike {
  registerHostEventHandler(handlers: {
    onInitialized(): void;
    onNotification(notification: { method: string; params: unknown }, extra: unknown): void;
    onRequest(request: { id: string; method: string; params: Record<string, unknown> }): boolean;
  }): () => void;
  registerInternalConnectionStateHandler(cb: (state: string) => void): () => void;
  handleClientResponse(response: unknown, validate: () => boolean): Promise<void>;
}

interface RouterManagerTarget {
  clearPrewarmedThreads(): void;
  markAllConversationsNeedResumeAfterReconnect(): void;
  onNotification(method: string, params: unknown, extra: unknown): void;
  onRequest(request: { id: string; method: string; params: Record<string, unknown> }): void;
  getConversation(threadId: string): unknown;
  getStreamRole(threadId: string): { role: string } | null;
  removePendingDynamicToolRequest(threadId: string, requestId: string): void;
  addThreadDeletedListener(cb: (threadId: string) => void): () => void;
}

/** server/native 双源请求路由（原 `xEe`）。 */
class HostRequestRouter {
  connection: HostConnectionLike;
  assertCurrent: () => void;
  assertLifetimeCurrent: () => void;
  requests = new Map<string, { method: string; origin: "server" | "native"; threadId: string | null }>();
  nativeResponses = new DynamicAppToolPendingResponses(dynamicAppToolResultSchema);
  cleanup: Array<() => void> = [];
  disposed = false;
  manager: RouterManagerTarget | null = null;

  constructor(connection: HostConnectionLike, assertCurrent: () => void, assertLifetimeCurrent: () => void) {
    this.connection = connection;
    this.assertCurrent = assertCurrent;
    this.assertLifetimeCurrent = assertLifetimeCurrent;
  }

  bind(manager: RouterManagerTarget) {
    this.assertCurrent();
    if (this.disposed || this.cleanup.length !== 0)
      throw new Error("Host manager events are retired or already bound");
    this.manager = manager;
    this.cleanup.push(
      this.connection.registerHostEventHandler({
        onInitialized: () => {
          if (!this.disposed) {
            try {
              this.assertLifetimeCurrent();
            } catch {
              return;
            }
            this.clearRequests();
            manager.clearPrewarmedThreads();
            manager.markAllConversationsNeedResumeAfterReconnect();
          }
        },
        onNotification: (notification, extra) => {
          if (
            !this.isCurrent() ||
            !isNotificationMethod(notification.method) ||
            notification.method === "configWarning" ||
            notification.method === "deprecationNotice"
          )
            return;
          const params = notification as { method: string; params: { requestId?: string } };
          if (params.method === "serverRequest/resolved") {
            if (this.requests.get(params.params.requestId ?? "")?.origin === "native") return;
            this.requests.delete(params.params.requestId ?? "");
          }
          manager.onNotification(notification.method, notification.params, extra);
        },
        onRequest: (request) =>
          this.isCurrent()
            ? this.requests.has(request.id)
              ? true
              : (this.requests.set(request.id, {
                  method: request.method,
                  origin: "server",
                  threadId: "threadId" in request.params && typeof request.params.threadId == "string" ? request.params.threadId : null,
                }),
                manager.onRequest(request),
                true)
            : false,
      }),
      this.connection.registerInternalConnectionStateHandler((state) => {
        if (state !== "connected")
          for (const [id, entry] of this.requests) entry.origin === "server" && this.requests.delete(id);
      }),
      manager.addThreadDeletedListener((threadId) => {
        for (const [id, entry] of this.requests) entry.threadId === threadId && this.cancelRequest(id, entry);
      }),
    );
  }

  /** 动态 app 工具的交互调用（原 `callInteractiveDynamicAppTool`）。 */
  async callInteractiveDynamicAppTool(request: { id: string; method: string; params: { threadId: string } }, signal: AbortSignal): Promise<unknown> {
    this.assertCurrent();
    signal.throwIfAborted();
    const manager = this.manager;
    if (this.disposed || manager == null) throw new Error("Host manager execution is not attached");
    const threadId = threadIdOf(request.params.threadId);
    if (manager.getConversation(threadId) == null || manager.getStreamRole(threadId)?.role === "follower")
      throw new Error("Host manager does not own the requested interactive task");
    if (this.requests.has(request.id)) throw new Error("Dynamic app tool request id is already in use");
    const entry = { method: request.method, threadId: request.params.threadId, origin: "native" as const };
    const response = this.nativeResponses.wait(request.id);
    response.catch(() => void 0);
    this.requests.set(request.id, entry);
    const onAbort = () => this.cancelRequest(request.id, entry);
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      return (manager.onRequest(request as never), await response);
    } finally {
      signal.removeEventListener("abort", onAbort);
      this.cancelRequest(request.id, entry);
    }
  }

  async sendResponse(method: string, response: { id: string }) {
    const entry = this.requests.get(response.id);
    if (entry?.method === method) {
      if (!this.isCurrent()) {
        this.cancelRequest(response.id, entry);
        return;
      }
      if (entry.origin === "native") {
        this.requests.delete(response.id);
        this.nativeResponses.route(response as never);
        return;
      }
      await this.connection.handleClientResponse(response, () =>
        !this.isCurrent() || this.requests.get(response.id) !== entry ? false : (this.requests.delete(response.id), true),
      );
    }
  }

  dispose() {
    this.disposed = true;
    for (const dispose of this.cleanup.splice(0)) dispose();
    this.clearRequests();
    this.manager = null;
  }

  private clearRequests() {
    for (const [id, entry] of this.requests) this.cancelRequest(id, entry);
  }

  private cancelRequest(id: string, entry: { origin: string; threadId: string | null }) {
    if (this.requests.get(id) !== entry) return;
    this.requests.delete(id);
    if (entry.origin === "native") {
      this.nativeResponses.cancel(id);
      if (entry.threadId != null)
        this.manager?.removePendingDynamicToolRequest(threadIdOf(entry.threadId), requestIdOf(id));
    }
  }

  private isCurrent(): boolean {
    if (this.disposed) return false;
    try {
      return (this.assertCurrent(), true);
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// host 上下文（原 `SEe`/`CEe`）
// ---------------------------------------------------------------------------

interface WorktreeRootsInput {
  codexHome: string;
  workspacesRoot?: string | null;
  worktreesSegment?: string | null;
}

/** worktree 候选根列表（原 `SEe`）：worktrees 段 / workspaces / codexHome 去重。 */
function worktreeRootCandidates({ codexHome, workspacesRoot, worktreesSegment }: WorktreeRootsInput): string[] {
  return [
    ...new Set(
      [
        worktreesSegment != null && isAbsolutePathLike(worktreesSegment) ? worktreesSegment : null,
        workspacesRoot == null ? null : normalizeWorktreeRoot(workspacesRoot),
        normalizeWorktreeRoot(codexHome),
      ].filter((root): root is string => root != null),
    ),
  ];
}

interface HostContextDeps {
  executionHost: { id: string };
  fetchHandler: {
    readCodexHome(hostId: string): string | Promise<string>;
    readCodexHomePaths(opts: { hostId: string }): Promise<{ workspacesRoot?: string | null }>;
    readFileBinary(opts: { path: string; hostId: string }): Promise<{ contentsBase64: string }>;
    readFileMetadata(opts: { path: string; hostId: string }): Promise<{ sizeBytes: number }>;
    uploadLocalFile(opts: { sourcePath: string; targetPath: string; hostId: string }): Promise<unknown>;
    ensureDirectory(opts: { hostId: string; path: string }): Promise<void>;
    readGitOrigins(opts: { dirs: string[]; hostId: string }): Promise<{ origins: unknown[] }>;
    createProjectlessThreadPaths(opts: { hostId: string; createSplitDirectories: boolean; prompt: unknown }): Promise<unknown>;
  };
  settings: { getEffective(key: string): Promise<unknown> };
  restricted: unknown;
  getRestrictedTaskRoot: (() => string | null) | undefined;
  assertCurrent(): void;
}

/** host 上下文（原 `CEe`）：附件/初始化/可视化根/受限根/watch 路径。 */
function createHostContext({ executionHost, fetchHandler, settings, restricted, getRestrictedTaskRoot, assertCurrent }: HostContextDeps) {
  const hostId = executionHost.id;
  assertCurrent();
  const visualizationRoot = (workspaceDir: string | null | undefined, id: string, fallback: string | null) => {
    // 原 `Tr().workspaceDir ? e : r`：可视化根按桌面可用性落在 workspace 或回退目录。
    const base = getDesktopFeatureAvailability().workspaceDir ? workspaceDir : fallback;
    const normalized = visualizationIdOf(id);
    return normalized == null || base == null ? null : joinPath(base, `visualizations/${normalized}/${id}`);
  };
  return {
    readThreadWorkspaceRoots: null,
    attachments: {
      createId: randomUUID,
      decodeText: (value: string) => Buffer.from(value, "base64").toString("utf8"),
      encodeBytes: (value: Uint8Array) => Buffer.from(value).toString("base64"),
      encodeText: (value: string) => Buffer.from(value, "utf8").toString("base64"),
      getBasename: (path: string) => posix.basename(normalizeSlashes(stripDrivePrefix(path))),
      getCodexHome: () => fetchHandler.readCodexHome(hostId),
      getMaxDirectTransferBytes: (isImage: boolean) => (isImage ? 10_485_760 : MAX_DIRECT_TRANSFER_BYTES),
      getTextExcerpt: (text: string) => text.trim().slice(0, 2e3),
      joinHostPath,
      joinPath,
      readLocalFile: async (path: string) => (await fetchHandler.readFileBinary({ path, hostId: "local" })).contentsBase64,
      readLocalFileSize: async (path: string) => (await fetchHandler.readFileMetadata({ path, hostId: "local" })).sizeBytes,
      uploadLocalFile: (sourcePath: string, targetPath: string) =>
        fetchHandler.uploadLocalFile({ sourcePath, targetPath, hostId }),
    },
    initialization: {
      hasDesktopRuntime: true,
      assertCurrent,
      readCodexHome: () => fetchHandler.readCodexHome(hostId),
      readWorkspacesRoot: async () => (await fetchHandler.readCodexHomePaths({ hostId })).workspacesRoot,
      getVisualizationRoot: visualizationRoot,
      ensureDirectory: async (path: string) => {
        assertCurrent();
        await fetchHandler.ensureDirectory({ hostId, path });
        assertCurrent();
      },
      readGitOrigins: async (dir: string) => (await fetchHandler.readGitOrigins({ dirs: [dir], hostId })).origins,
      restricted,
    },
    createProjectlessThreadWorkspace: (prompt: unknown) =>
      fetchHandler.createProjectlessThreadPaths({ hostId, createSplitDirectories: false, prompt }),
    getManagedWorktreeRoots: async () => worktreeRootCandidates((await fetchHandler.readCodexHomePaths({ hostId })) as never),
    getConfiguredWorktreeRoot: async () => ((await settings.getEffective("worktreeRoot")) as string | undefined)?.trim(),
    getVisualizationRoot: visualizationRoot,
    getRestrictedTaskRoot,
    getOpenFileWatchPath(hostPath: string, watchPath: string, hostKind: string) {
      const host = normalizeSlashes(stripDrivePrefix(hostPath));
      let watch = normalizeSlashes(stripDrivePrefix(watchPath));
      if ((isWindowsPath(host) || isUncPath(host)) && watch.startsWith("/") && !watch.startsWith("//"))
        watch = normalizeSlashes(win32.resolve(host, watch));
      const joined = normalizeUncPath(isAbsolutePathLike(watch) || host === "" ? watch : joinPath(host, watch));
      return isAbsolutePathLike(joined)
        ? hostKind === "local" && process.platform === "win32"
          ? stripCygdrivePrefix(joined)
          : joined
        : null;
    },
  };
}

// ---------------------------------------------------------------------------
// host thread read state（原 `wEe`）
// ---------------------------------------------------------------------------

// Thread read state lifecycle is implemented by conversation/thread-read-state-controller.
// ---------------------------------------------------------------------------
// AppServerRequestSender（原 `EEe`）
// ---------------------------------------------------------------------------

const PLUGIN_LIST_TIMEOUT_MS = 3e4;

/** host 请求发送器（原 `EEe`）。 */
class AppServerRequestSender {
  connection: {
    appServerVersion: string;
    getPendingRequestCount(): number;
    handleHostRequest(request: unknown, options: unknown, _: undefined, onOutcomeUnknown: ((error: unknown) => void) | undefined, assertCurrent: () => void, savedEnvironmentConfig: unknown): { promise: Promise<{ error?: unknown; result?: unknown }>; abandon(): void };
    handleHostPrewarmThreadStart(request: unknown, options: unknown, _: undefined, onOutcomeUnknown: ((error: unknown) => void) | undefined, assertCurrent: () => void, savedEnvironmentConfig: unknown): { promise: Promise<{ error?: unknown; result?: unknown }>; abandon(): void };
  };
  hostId: string;
  assertCurrent: () => void;
  requestLifecycleListeners = new Set<(event: { type: string; hostId: string; error?: unknown }) => void>();

  constructor(connection: AppServerRequestSender["connection"], hostId: string, assertCurrent: () => void) {
    this.connection = connection;
    this.hostId = hostId;
    this.assertCurrent = assertCurrent;
  }

  async sendRequest(method: string, params: unknown, options?: { trace?: unknown; timeoutMs?: number; priority?: unknown; source?: unknown; widget?: unknown; onOutcomeUnknown?: (error: unknown) => void; savedEnvironmentConfig?: unknown }) {
    return await this.send(
      this.createRequest(method, params, options?.trace),
      options,
      false,
      method === "thread/start" ||
        method === "thread/startAeon" ||
        method === "thread/fork" ||
        method === "turn/start" ||
        method === "turn/steer" ||
        method === "plugin/uninstall",
    );
  }

  async sendAppServerExtensionRequest(method: string, params: unknown, options?: { trace?: unknown; timeoutMs?: number }) {
    return await this.send(this.createExtensionRequest(method, params, options?.trace), options, false, true);
  }

  async prewarmThreadStart(params: unknown, options?: { trace?: unknown; timeoutMs?: number; priority?: unknown; source?: unknown; widget?: unknown; onOutcomeUnknown?: (error: unknown) => void; savedEnvironmentConfig?: unknown }) {
    return await this.send(this.createRequest("thread/start", params, options?.trace), options, true, true);
  }

  getAppServerVersion() {
    return this.connection.appServerVersion;
  }

  supportsPaginatedThreadHistory() {
    return supportsPaginatedHistory(this.connection.appServerVersion);
  }

  getCompatibleThreadSortKey(sortKey: string) {
    return sortKey === "recency_at"
      ? supportsRecencySortKey(this.connection.appServerVersion)
        ? "recency_at"
        : "updated_at"
      : sortKey;
  }

  getPendingRequestCount() {
    return this.connection.getPendingRequestCount();
  }

  addRequestLifecycleListener(listener: (event: { type: string; hostId: string; error?: unknown }) => void) {
    this.requestLifecycleListeners.add(listener);
    return () => {
      this.requestLifecycleListeners.delete(listener);
    };
  }

  createRequest(method: string, params: unknown, trace?: unknown) {
    return { id: requestIdOf(method + ":" + randomUUID()), method, params, trace };
  }

  createExtensionRequest(method: string, params: unknown, trace?: unknown) {
    return {
      id: requestIdOf(method + ":" + randomUUID()),
      method,
      params,
      ...(trace == null ? {} : { trace }),
    };
  }

  private async send(
    request: { id: string; method: string },
    options: { timeoutMs?: number; priority?: unknown; source?: unknown; widget?: unknown; onOutcomeUnknown?: (error: unknown) => void; savedEnvironmentConfig?: unknown } | undefined,
    isPrewarm: boolean,
    skipCurrentAssert: boolean,
  ) {
    const timeoutMs = request.method === "plugin/list" && options?.timeoutMs == null ? PLUGIN_LIST_TIMEOUT_MS : options?.timeoutMs;
    return runAppServerRequestLifecycle({ request, options, isPrewarm, skipCurrentAssert, hostId: this.hostId, timeoutMs,
      assertCurrent: this.assertCurrent,
      handleRequest: (input, sendOptions, outcomeUnknown) => this.connection.handleHostRequest(input, sendOptions, undefined, outcomeUnknown, this.assertCurrent, options?.savedEnvironmentConfig),
      handlePrewarm: (input, sendOptions, outcomeUnknown) => this.connection.handleHostPrewarmThreadStart(input, sendOptions, undefined, outcomeUnknown, this.assertCurrent, options?.savedEnvironmentConfig),
      requestError: (id, error) => requestErrorOf(String(id), error), onOutcomeUnknown: options?.onOutcomeUnknown,
      emitLifecycle: (event) => { for (const listener of this.requestLifecycleListeners) listener(event); } });
  }
}

// ---------------------------------------------------------------------------
// host services（原 `DEe`）
// ---------------------------------------------------------------------------

interface HostServicesDeps {
  executionHost: { id: string; codexHome(): Promise<string> };
  fetchHandler: { queuedFollowUpSendLocks: QueuedMessageLocks; pinnedThreadsService: unknown; buildMcpCodexConfig(model: unknown): Promise<unknown>; readWorktreeShellEnvironment(model: unknown, hostId: string): Promise<unknown>; getProjectAwareDeveloperInstructions(opts: unknown): Promise<unknown> };
  remoteConnections: { startRemoteChatgptLoginPortForward(a: unknown, b: unknown): Promise<void>; stopRemoteChatgptLoginPortForward(a: unknown, b: unknown): Promise<void> };
  archive: { archiveInactiveThread(opts: unknown): Promise<unknown>; deleteAllArchivedThreads(opts: { hostId: string }): Promise<{ deletedThreadIds: string[] }>; deleteArchivedThread(opts: { hostId: string; threadId: string }): Promise<{ deletedThreadIds: string[] }> };
  catalog: { removeMissingEntry(threadId: string): Promise<boolean> } | null;
  accountId: () => string | null;
  pauseRestrictedRuntime: unknown;
  assertCurrent(): void;
}

interface QueuedMessageLocks {
  tryAcquireStartTurn(conversationId: string): boolean;
  releaseStartTurn(conversationId: string): void;
  tryAcquire(opts: { conversationId: string; messageId: string; lockId: string }): boolean;
  release(opts: { conversationId: string; messageId: string; lockId: string; sent: boolean }): void;
}

/** host services（原 `DEe`）。 */
function createHostServices({
  executionHost,
  fetchHandler,
  remoteConnections,
  archive,
  catalog,
  accountId,
  pauseRestrictedRuntime,
  assertCurrent,
}: HostServicesDeps) {
  const locks = fetchHandler.queuedFollowUpSendLocks;
  return {
    accountId,
    isCopilotApiAvailable: async () => false,
    queuedMessages: {
      automaticExecutionEnabled: false,
      isHostForConversation: () => false,
      canAcquireOwnership: () => true,
      tryAcquireStartTurn(conversationId: string) {
        assertCurrent();
        return locks.tryAcquireStartTurn(conversationId);
      },
      releaseStartTurn: (conversationId: string) => locks.releaseStartTurn(conversationId),
      async acquireSendLock(conversationId: string, messageId: string) {
        assertCurrent();
        const lockId = randomUUID();
        return locks.tryAcquire({ conversationId, messageId, lockId })
          ? {
              async release(sent: boolean) {
                locks.release({ conversationId, messageId, lockId, sent });
              },
            }
          : null;
      },
    },
    async startRemoteChatGptLoginPortForward(a: unknown, b: unknown) {
      assertCurrent();
      await remoteConnections.startRemoteChatgptLoginPortForward(a, b);
    },
    async stopRemoteChatGptLoginPortForward(a: unknown, b: unknown) {
      await remoteConnections.stopRemoteChatgptLoginPortForward(a, b);
    },
    preserveWorkspaceSandboxPolicy: false,
    killNodeReplExecutions(sessionId: string, turnId: string) {
      assertCurrent();
      if (executionHost.id !== "local") return null;
      const abort = new AbortController();
      return {
        result: executionHost.codexHome().then((codexHome) => (assertCurrent(), killNodeReplExecution({ codexHome, sessionId, turnId, signal: abort.signal }))),
        cancel: () => abort.abort(),
      };
    },
    createAbortController: () => new AbortController(),
    parseUrl,
    hasDesktopRuntime: true,
    archiveUndoDurationMs,
    inactiveThreadArchive: {
      archiveInactiveThread: (opts: unknown) => archive.archiveInactiveThread(opts),
      async removeMissingEntry(threadId: string) {
        return (assertCurrent(), catalog?.removeMissingEntry(threadId) ?? false);
      },
    },
    async deleteArchivedThreads(hostId: string, threadId: string | null) {
      assertCurrent();
      return (
        threadId == null
          ? await archive.deleteAllArchivedThreads({ hostId })
          : await archive.deleteArchivedThread({ hostId, threadId })
      ).deletedThreadIds;
    },
    pinnedThreads: async () => fetchHandler.pinnedThreadsService,
    threadMode: (hostKind: string) => (hostKind === "durable" ? "durable" : "default"),
    pauseRestrictedRuntime,
  };
}

// ---------------------------------------------------------------------------
// prompt 限额（原 `RT`/`zT`/`BT`/`OEe`/`kEe`）
// ---------------------------------------------------------------------------

const MAX_PROMPT_BYTES = 65536;

const optionalPromptSectionSchema = (stringSchema() as { trim(): { transform(fn: (value: string) => string | undefined): { optional(): unknown } } })
  .trim()
  .transform((value: string) => value || undefined)
  .optional();
const boundedPromptSectionSchema = ((stringSchema() as unknown as { max(n: number): { refine(fn: (value: string) => boolean): { transform(fn: (value: string) => string | undefined): { optional(): unknown } } } })
  .max(MAX_PROMPT_BYTES))
  .refine((value: string) => new TextEncoder().encode(value).byteLength <= MAX_PROMPT_BYTES)
  .transform((value: string) => (value.trim() ? value : undefined))
  .optional();

const promptOverridesSchema = objectSchema({
  desktop_context_section: optionalPromptSectionSchema,
  workspace_dependencies_section: optionalPromptSectionSchema,
  memory_read_prompt: boundedPromptSectionSchema,
  memory_phase_one_prompt: boundedPromptSectionSchema,
  memory_phase_two_prompt: boundedPromptSectionSchema,
});

/** 解析 instruction 覆盖（原 `kEe`）：全空返回 null。 */
function parsePromptOverrides(raw: unknown) {
  const parsed = (promptOverridesSchema as { safeParse(input: unknown): { success: boolean; data?: Record<string, string | undefined> } }).safeParse(raw);
  if (!parsed.success) return null;
  const data = parsed.data ?? {};
  const {
    desktop_context_section: desktopContextSection,
    workspace_dependencies_section: workspaceDependenciesSection,
    memory_read_prompt: memoryReadPrompt,
    memory_phase_one_prompt: memoryPhaseOnePrompt,
    memory_phase_two_prompt: memoryPhaseTwoPrompt,
  } = data;
  if (desktopContextSection == null && workspaceDependenciesSection == null && memoryReadPrompt == null && memoryPhaseOnePrompt == null && memoryPhaseTwoPrompt == null)
    return null;
  return {
    desktopContextSection,
    workspaceDependenciesSection,
    ...(memoryReadPrompt == null ? {} : { memoryReadPrompt }),
    ...(memoryPhaseOnePrompt == null ? {} : { memoryPhaseOnePrompt }),
    ...(memoryPhaseTwoPrompt == null ? {} : { memoryPhaseTwoPrompt }),
  };
}

// ---------------------------------------------------------------------------
// 执行设置与执行配置（原 `AEe`/`jEe`）
// ---------------------------------------------------------------------------

interface ExecutionSettingsDeps {
  settings: { read(key: string): Promise<{ effective: unknown }>; getEffective(key: string): Promise<unknown>; onDidChange(key: string, cb: () => void): () => void };
  evaluations: { readExecutionAssignments(arg?: unknown): Promise<{ defaultEnableFeatures: Record<string, unknown> | null; identity: unknown; values: { personality: { default_personality?: string }; instructions: Record<string, unknown>; permissionRefresh?: boolean } } | null>; getReadyClient(): { checkGate(name: string): boolean } | null; readReadyExecutionAssignments(arg?: unknown): { defaultEnableFeatures: Record<string, unknown> | null } | null; hasReadyExecutionAssignments(): Promise<boolean> };
}

/** 读取执行设置（原 `AEe`）。 */
async function readExecutionSettings(
  settings: ExecutionSettingsDeps["settings"],
  evaluations: ExecutionSettingsDeps["evaluations"],
  { model, appServerVersion }: { model: string | null; appServerVersion: unknown },
) {
  const assignments = await evaluations.readExecutionAssignments(appServerVersion);
  if (assignments?.defaultEnableFeatures == null)
    return { status: "not-ready", reason: "execution-config-loading" };
  const [defaultMode, detailMode] = await Promise.all([
    settings.read((defaultModeSettings as { defaultModeRequestUserInput: { key: string } }).defaultModeRequestUserInput.key),
    settings.read((conversationDetailSettings as { conversationDetailMode: { key: string } }).conversationDetailMode.key),
  ]);
  if ((defaultMode as { effective: unknown }).effective == null || (detailMode as { effective: unknown }).effective == null)
    return { status: "not-ready", reason: "execution-config-loading" };
  const overrides = composeFeatureOverrides(assignments.defaultEnableFeatures, (defaultMode as { effective: unknown }).effective === true);
  const writingBlocks = (overrides as { writing_blocks?: boolean } | null)?.writing_blocks === true;
  const includeProseDetailLevelInstructions = (detailMode as { effective: string }).effective === "STEPS_PROSE";
  return {
    defaultFeatureOverrides: overrides,
    defaultPersonality: normalizePersonality(assignments.values.personality.default_personality) ?? "friendly",
    instructionOverrides: model == null ? null : parsePromptOverrides(assignments.values.instructions[model] ?? {}),
    includeProseDetailLevelInstructions,
    writingBlocks,
  };
}

function normalizePersonality(value: string | undefined): string | null {
  return typeof value == "string" && value.length > 0 ? value : null;
}

interface ExecutionConfigDeps {
  hostId: string;
  globalState: { get(key: unknown): Record<string, unknown> | undefined; getStored(key: unknown): unknown; get(key2: unknown): unknown; onDidChange(key: unknown, cb: () => void): () => void; updateAndPersist(key: unknown, fn: (value: unknown) => unknown): Promise<void> };
  settings: ExecutionSettingsDeps["settings"];
  settingsStore: { getEffective(key: string): unknown };
  evaluations: ExecutionSettingsDeps["evaluations"];
  getAppServerVersion(): string;
  fetchHandler: ExecutionConfigDeps2;
  accountId: () => string | null;
  catalog: { readEntries(entries: { hostId: string; threadId: string }[]): Array<{ sourceKind: string; hostId: string; threadId: string }> } | null;
  restricted: unknown;
  assertCurrent(): void;
}

interface ExecutionConfigDeps2 {
  buildMcpCodexConfig(model: unknown): Promise<unknown>;
  readWorktreeShellEnvironment(model: unknown, hostId: string): Promise<unknown>;
  getProjectAwareDeveloperInstructions(opts: unknown): Promise<{ instructions: unknown }>;
}

/** host 执行配置（原 `jEe`）。 */
function createHostExecutionConfig({
  hostId,
  globalState,
  settings,
  settingsStore,
  evaluations,
  getAppServerVersion,
  fetchHandler,
  accountId,
  catalog,
  restricted,
  assertCurrent,
}: ExecutionConfigDeps) {
  return {
    isBrowserRuntime: false,
    usesDesktopMcp: hostId === "local",
    isTokenBudgetThread: (threadKey: string) => (globalState.get(PERSISTED_ATOM_STATE_KEY) ?? {})[`${hostId}\n${threadKey}`] === true,
    allowMemoryPromptOverrides: hostId === "local",
    async readCatalogEntry(threadHostId: string, threadId: string) {
      assertCurrent();
      return catalog
        ?.readEntries([{ hostId: threadHostId, threadId }])
        .find((entry) => entry.sourceKind !== "chatgpt" && entry.hostId === threadHostId && entry.threadId === threadId);
    },
    restricted,
    async readSettings(model: string | null) {
      assertCurrent();
      const result = await readExecutionSettings(settings, evaluations, { model, appServerVersion: getAppServerVersion() });
      assertCurrent();
      return result;
    },
    fetchProxyConfig: async () => null,
    readCodexConfig: (model: unknown) => (hostId === "local" ? fetchHandler.buildMcpCodexConfig(model) : Promise.resolve(null)),
    readShellEnvironment: (model: unknown) => fetchHandler.readWorktreeShellEnvironment(model, hostId),
    readDeveloperInstructions: async (request: unknown) => ({
      instructions: await fetchHandler.getProjectAwareDeveloperInstructions({ ...(request as object), hostId }),
    }),
    async readFollowUpQueueMode() {
      assertCurrent();
      return (await settings.getEffective((settingsGroup as { followUpQueueMode: { key: string } }).followUpQueueMode.key)) === "queue" ? "queue" : "send-now";
    },
    async readPermissionRefreshEnabled() {
      assertCurrent();
      const assignments = await evaluations.readExecutionAssignments();
      assertCurrent();
      return assignments?.values.permissionRefresh ?? null;
    },
    subscribeExecutionSettingsChanged(cb: () => void) {
      const unsubscribeDetail = settings.onDidChange((conversationDetailSettings as { conversationDetailMode: { key: string } }).conversationDetailMode.key, cb);
      const unsubscribeDefault = settings.onDidChange((defaultModeSettings as { defaultModeRequestUserInput: { key: string } }).defaultModeRequestUserInput.key, cb);
      return () => {
        unsubscribeDetail();
        unsubscribeDefault();
      };
    },
    history: {
      useTailHydration: true,
      canonicalTurnHistory: true,
      readThreadTimelineEnabled() {
        assertCurrent();
        return evaluations.getReadyClient()?.checkGate("codex-app-thread-timeline-history") === true;
      },
      paginatedHistoryEnabled: true,
      readCatalogConsumptionEnabled() {
        assertCurrent();
        return catalog != null;
      },
    },
    readDefaultFeatureOverrides() {
      assertCurrent();
      const assignments = evaluations.readReadyExecutionAssignments(getAppServerVersion());
      return assignments?.defaultEnableFeatures == null
        ? null
        : composeFeatureOverrides(
            assignments.defaultEnableFeatures,
            settingsStore.getEffective((defaultModeSettings as { defaultModeRequestUserInput: { key: string } }).defaultModeRequestUserInput.key) === true,
          );
    },
    async hasReadyExecutionAssignments() {
      assertCurrent();
      return evaluations.hasReadyExecutionAssignments();
    },
    async readExperimentPersonality() {
      assertCurrent();
      const assignments = await evaluations.readExecutionAssignments();
      assertCurrent();
      return assignments == null ? null : (normalizePersonality(assignments.values.personality.default_personality) ?? "friendly");
    },
    read(feature: string) {
      assertCurrent();
      const client = evaluations.getReadyClient();
      if (client != null)
        return feature === "sidebarCustomSectionsEnabled"
          ? accountId() != null && client.checkGate("codex-app-sidebar-custom-sections")
          : client.checkGate("codex-app-server-custom-sections") && client.checkGate("codex-app-server-pinned-threads");
    },
  };
}

// ---------------------------------------------------------------------------
// 存储桥（原 `NEe`）与 catalog 订阅（原 `PEe`）
// ---------------------------------------------------------------------------

const storageLogger = memoizedTaggedLogger("host-app-server-storage");

interface HostStorageDeps {
  globalState: {
    get(key: unknown): Record<string, unknown> | undefined;
    update(key: unknown, fn: (value: unknown) => unknown): void;
    getStored(key: unknown): unknown;
    updateAndPersist(key: unknown, fn: (value: unknown) => unknown): Promise<void>;
    onDidChange(key: unknown, cb: (value: unknown) => void): () => void;
  };
  fetchHandler: { getGlobalStateValue(key: unknown): Promise<unknown>; setGlobalStateValue(key: unknown, value: unknown): Promise<void> };
  windowManager: { sendMessageToAllWindows(message: unknown): void };
  assertCurrent(): void;
}

/** host 存储桥（原 `NEe`）。 */
function createHostStorage({ globalState, fetchHandler, windowManager, assertCurrent }: HostStorageDeps) {
  return {
    readValue(key: string) {
      assertCurrent();
      return (globalState.get(PERSISTED_ATOM_STATE_KEY) ?? {})[key];
    },
    writeValue(key: string, value: unknown) {
      assertCurrent();
      globalState.update(PERSISTED_ATOM_STATE_KEY, (all) => {
        const next = { ...(all as Record<string, unknown>) };
        if (value === undefined) delete next[key];
        else
          Object.defineProperty(next, key, {
            configurable: true,
            enumerable: true,
            value,
            writable: true,
          });
        return next;
      });
      windowManager.sendMessageToAllWindows({
        type: "persisted-atom-updated",
        key,
        value: value === undefined ? null : value,
        deleted: value === undefined,
      });
    },
    async readGlobalState(key: string) {
      assertCurrent();
      return fetchHandler.getGlobalStateValue(key);
    },
    async updateGlobalState(key: string, transform: (current: unknown) => unknown) {
      assertCurrent();
      switch (key) {
        case (STATE_KEYS as { THREAD_WRITABLE_ROOTS: string }).THREAD_WRITABLE_ROOTS:
          fetchHandler.setGlobalStateValue(key, dedupeThreadRoots(transform(globalState.get(key))));
          break;
        case (STATE_KEYS as { THREAD_PROJECTLESS_OUTPUT_DIRECTORIES: string }).THREAD_PROJECTLESS_OUTPUT_DIRECTORIES:
          fetchHandler.setGlobalStateValue(key, (recordSchema(stringSchema(), stringSchema()) as { parse(input: unknown): unknown }).parse(transform(globalState.get(key))));
          break;
        case (STATE_KEYS as { SIDEBAR_PROJECT_THREAD_ORDERS: string }).SIDEBAR_PROJECT_THREAD_ORDERS:
          fetchHandler.setGlobalStateValue(key, normalizeThreadOrders(transform(globalState.get(key))));
          break;
        default:
          throw new Error(`AppServerManager cannot update global state ${key}`);
      }
    },
    readQueuedFollowUps() {
      assertCurrent();
      return { isLoading: false, value: globalState.getStored((STATE_KEYS as { QUEUED_FOLLOW_UPS: string }).QUEUED_FOLLOW_UPS) };
    },
    async loadQueuedFollowUps() {
      assertCurrent();
      return globalState.get((STATE_KEYS as { QUEUED_FOLLOW_UPS: string }).QUEUED_FOLLOW_UPS) ?? {};
    },
    async updateQueuedFollowUps(update: (current: unknown) => unknown) {
      assertCurrent();
      await globalState.updateAndPersist((STATE_KEYS as { QUEUED_FOLLOW_UPS: string }).QUEUED_FOLLOW_UPS, (current) => (assertCurrent(), update(current ?? {})));
      try {
        windowManager.sendMessageToAllWindows({ type: "global-state-updated", keys: [(STATE_KEYS as { QUEUED_FOLLOW_UPS: string }).QUEUED_FOLLOW_UPS] });
      } catch (error) {
        storageLogger().warning("Failed to broadcast committed queue update", {
          safe: {},
          sensitive: { error },
        });
      }
    },
    subscribeQueuedFollowUps: (cb: (value: unknown) => void) => globalState.onDidChange((STATE_KEYS as { QUEUED_FOLLOW_UPS: string }).QUEUED_FOLLOW_UPS, cb),
  };
}

/** THREAD_WRITABLE_ROOTS 的去重（原 `Ex`，36,470 区间的纯函数，此处内联）。 */
function dedupeThreadRoots(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return [...new Set(value.filter((root): root is string => typeof root == "string" && root.length > 0))];
}

/** catalog 订阅（原 `PEe`）。 */
async function subscribeCatalogThreads({
  manager,
  catalog,
  assertCurrent,
}: {
  manager: { refreshRecentConversations(opts: { mode: string }): Promise<void>; getHostId(): string; observeCatalogThreads(threads: unknown): void };
  catalog: { subscribeThreadObservations(cb: (observation: { hostId: string; threads: unknown }) => void): { dispose(): void } };
  assertCurrent(): void;
}) {
  assertCurrent();
  await manager.refreshRecentConversations({ mode: "catalog" });
  assertCurrent();
  const hostId = manager.getHostId();
  return catalog.subscribeThreadObservations((observation) => {
    if (observation.hostId === hostId) {
      try {
        assertCurrent();
      } catch {
        return;
      }
      manager.observeCatalogThreads(observation.threads);
    }
  });
}

// ---------------------------------------------------------------------------
// Hosted manager composition（原 `FEe`）与 execution-path RPC（原 `IEe`）
// ---------------------------------------------------------------------------

type HostedManagerFactoryDependencies = {
  HostClientCoordination: new (
    hostId: string,
    errorReporter: unknown,
    getThreadReadStateContext: unknown,
    assertCurrent: () => void,
  ) => any;
  serializeConversationState(value: unknown): unknown;
};

/**
 * 完整装配单个 host 的 AppServerConversationManager。
 *
 * 保留原 `FEe` 的两阶段生命周期：read-state owner 先建立，manager 成功后才
 * 绑定 request/coordination；任一阶段失败均按 abort → router → catalog →
 * manager → read-state → coordination 的顺序回收。
 */
function createHostedAppServerManagerFactory(dependencies: HostedManagerFactoryDependencies) {
  return async function createHostedAppServerManager(options: any) {
    const { connection, context, fetchHandler, assertCurrent } = options;
    assertCurrent();
    const settings = fetchHandler.settings;
    if (settings == null) throw Error("Settings store unavailable");

    const accountId = () =>
      context.identity.kind === "chatgpt" ? context.identity.accountId : null;
    const filesystem = createHostContext({
      executionHost: options.executionHost,
      fetchHandler,
      settings,
      restricted: options.restricted?.initialization,
      getRestrictedTaskRoot: options.restricted?.getTaskRoot,
      assertCurrent,
    });
    const readState = await createHostThreadReadState({
      owner: options.threadReadState,
      subscribeIdentityChanges: options.subscribeIdentityChanges,
      hostId: options.hostId,
      context,
      assertCurrent,
      assertLifetimeCurrent: options.assertLifetimeCurrent,
    });

    let coordination: any;
    const abortController = new AbortController();
    const router = new HostRequestRouter(
      connection,
      assertCurrent,
      options.assertLifetimeCurrent,
    );
    let manager: AppServerConversationManager | null = null;
    let catalogSubscription: { dispose(): void } | null = null;

    try {
      assertCurrent();
      if (options.localClientCoordinationEnabled) {
        coordination = new dependencies.HostClientCoordination(
          options.hostId,
          options.errorReporter,
          options.getThreadReadStateContext,
          assertCurrent,
        );
      }
      const logger = createTaggedLogger("host-app-server-manager");
      const hostedManager = new AppServerConversationManager({
        hostId: options.hostId,
        transport: new AppServerRequestSender(connection, options.hostId, assertCurrent),
        logger,
        threadExecution: options.threadExecution ?? null,
        pendingThreadArchives: {
          add(threadId: string, placement: unknown) {
            assertCurrent();
            connection.registerArchiveThread(threadId, placement);
          },
          remove(threadId: string) {
            assertCurrent();
            connection.registerUnarchiveThread(threadId);
          },
        },
        sendAppServerResponse(method: string, response: { id: string }) {
          router.sendResponse(method, response).catch((error) => {
            logger.warning("Hosted server response failed", {
              safe: {},
              sensitive: { error },
            });
          });
        },
        ipcBridge: coordination?.bridge ?? null,
        coordination:
          coordination == null
            ? null
            : createThreadStreamBroadcastHandlers(
                coordination.bridge,
                dependencies.serializeConversationState,
              ),
        queuedMessageCoordination: coordination?.queuedMessages,
        scheduler: {
          schedule(callback: () => void, delayMs: number) {
            const timeout = setTimeout(callback, delayMs);
            return () => clearTimeout(timeout);
          },
          scheduleMicrotask: queueMicrotask,
        },
        threadProjectAssignments: options.threadProjectAssignments,
        savedReadState: readState.state,
        storage: createHostStorage({
          globalState: options.globalState,
          fetchHandler,
          windowManager: options.windowManager,
          assertCurrent,
        }),
        filesystem,
        settings: createHostExecutionConfig({
          hostId: options.hostId,
          globalState: options.globalState,
          settings,
          settingsStore: options.settingsStore,
          evaluations: options.evaluations,
          getAppServerVersion: () => connection.appServerVersion,
          fetchHandler,
          accountId,
          catalog: options.catalog,
          restricted: options.restricted?.resume,
          assertCurrent,
        }),
        runtime: createHostServices({
          executionHost: options.executionHost,
          fetchHandler,
          remoteConnections: options.remoteConnections,
          archive: options.archive,
          catalog: options.catalog,
          accountId,
          pauseRestrictedRuntime: options.restricted?.pauseRuntime,
          assertCurrent,
        }),
      });
      manager = hostedManager;

      if (options.threadExecution != null) {
        coordination?.bind(hostedManager);
        router.bind(hostedManager);
      }
      catalogSubscription =
        options.catalog == null
          ? null
          : await subscribeCatalogThreads({
              manager: hostedManager,
              catalog: options.catalog,
              assertCurrent,
            });

      const activeCoordination = coordination;
      return {
        manager: hostedManager,
        signal: abortController.signal,
        callInteractiveDynamicAppTool: (request: any, signal: AbortSignal) =>
          router.callInteractiveDynamicAppTool(request, signal),
        dispose() {
          abortController.abort();
          router.dispose();
          catalogSubscription?.dispose();
          AppServerConversationManager.dispose(hostedManager);
          readState.dispose();
          activeCoordination?.dispose();
        },
      };
    } catch (error) {
      abortController.abort();
      router.dispose();
      catalogSubscription?.dispose();
      if (manager != null) AppServerConversationManager.dispose(manager);
      readState.dispose();
      coordination?.dispose();
      throw error;
    }
  };
}

/** Thin RPC endpoint retained because the base class supplies dispatch metadata. */
function createCodexHomeServiceClass(RpcHandlerBase: new (...args: any[]) => any) {
  return class CodexHomeService extends RpcHandlerBase {
    constructor(private readonly fetchHandler: any) {
      super();
    }

    readCodexHome(input: unknown) {
      return this.fetchHandler.readCodexHome(input);
    }
  };
}

export {
  DynamicAppToolPendingResponses,
  HostRequestRouter,
  worktreeRootCandidates,
  createHostContext,
  createHostThreadReadState,
  AppServerRequestSender,
  createHostServices,
  MAX_PROMPT_BYTES,
  parsePromptOverrides,
  readExecutionSettings,
  createHostExecutionConfig,
  createHostStorage,
  subscribeCatalogThreads,
  createHostedAppServerManagerFactory,
  createCodexHomeServiceClass,
  type HostConnectionLike,
  type RouterManagerTarget,
};
