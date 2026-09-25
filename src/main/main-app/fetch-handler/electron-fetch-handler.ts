// electron-fetch-handler —— renderer→main 的 RPC 分发中枢（PBe 巨类）。
//
// 对应 main-C-Mhak1n.ts 的 96,195-97,879 行区段（~1,670 行）：
//   - KH = logger('electron-fetch-handler')；qH = 禁写 state 键集
//     （PROJECT_ORDER）；JH/NBe = global-dictation 热键 stub（5s/10s 超时，
//     supported: false）；XH = Not-implemented 错误
//   - PBe 类（96,206-97,879）：
//     · ~45 个构造参数的依赖容器（globalState/projectsManager/
//       threadProjectAssignments/appServerConnectionRegistry/appServerClient/
//       remoteConnectionsHandler/hotkeyWindowLifecycleManager/windowManager/
//       settingsStore/pinnedThreadsService/automationsService/
//       realtimeSessionRecorder/queuedFollowUpSendLocks 等）
//     · 40 个方法（getInitialSidebarWorkspaceState / createProjectlessThreadPaths
//       （复用 ds）/ recordProjectlessThread（双 globalState 键 + 全窗口广播）/
//       assertBrowserUseGlobalPersistentApprovalAllowed / pickFilesFromDialog /
//       git root 解析四态（selected/request/wsl/getSelectedGitRoot）/
//       readCodexHome（xP 限额读）/ readFileMetadata / ensureDirectory /
//       readFileBinary / uploadLocalFile / readGitOrigins /
//       readWorktreeShellEnvironment / globalState 读写（禁写键拦截）/
//       configuration/setting 读写 + applySettingSideEffects /
//       getSettingsStore / handleVSCodeRequest）
//     · handlers 表（96,417-97,879）：128 个 kebab-case RPC 方法
//       （完整清单见 docs/main-fetch-handler-methods.json——workspace/worktree/
//       remote-connections/browser-use/global-dictation/keymap/feedback/
//       skills/agents-md/git 六件套/automations/ambient/外部 agent 导入/
//       设置五通道/apply-patch/mcp-codex-config/computer-use 等）
//     · handleVSCodeRequest：方法查表 → 参数注入 origin/signal →
//       git 操作源守卫（n.Fs）+ 包裹（n.W）；未实现错误映射 XH
//
// 本模块为语义骨架（依赖注入接口 + 分发协议 + handler 注册面）；
// 128 个 handler 的具体实现按 docs/main-fetch-handler-methods.json
// 逐簇回填（各簇的业务逻辑已在 main-app 的 143 个模块中落地）。

import { createTaggedLogger } from "@chunk/logger";

const logger = createTaggedLogger("electron-fetch-handler");

// ---------------------------------------------------------------------------
// 协议类型
// ---------------------------------------------------------------------------

/** RPC 请求载荷（renderer 经消息桥发来）。 */
export interface FetchRequest<P = Record<string, unknown>> {
  origin: unknown;
  signal?: AbortSignal;
  [key: string]: unknown;
}

/** RPC 处理器。 */
export type FetchHandler<P = Record<string, unknown>> = (request: FetchRequest<P>) => Promise<unknown> | unknown;

/** 依赖容器（PBe 构造参数的结构化子集——45 个注入点）。 */
export interface FetchHandlerDependencies {
  globalState: {
    get(key: unknown): unknown;
    set(key: unknown, value: unknown): void;
    update(key: unknown, updater: (value: unknown) => unknown): void;
  };
  projectsManager: unknown;
  threadProjectAssignments: {
    setProjectless(request: { projectless: boolean; threadId: string }): Promise<unknown>;
  };
  appServerConnectionRegistry: { getConnection(channel: unknown): unknown };
  appServerClient: unknown;
  remoteConnectionsHandler: unknown;
  hotkeyWindowLifecycleManager: unknown;
  windowManager: { sendMessageToAllWindows(message: unknown): void };
  settingsStore?: {
    get(key: unknown): unknown;
    getEffective(key: unknown): unknown;
    set(key: unknown, value: unknown): void;
  } | null;
  errorReporter: { reportNonFatal(error: Error, context: unknown): void };
  repoRoot: string;
  globalDictationHotkeyController: unknown;
  pinnedThreadsService: unknown;
  automationsService: unknown;
  realtimeSessionRecorder: unknown;
  queuedFollowUpSendLocks: Map<string, { acquiredAtMs: number; holders: Set<string> }>;
}

// ---------------------------------------------------------------------------
// 常量与 stub（原 `qH`/`JH`/`NBe`/`XH`）
// ---------------------------------------------------------------------------

/** 禁写的 global-state 键（原 `qH`：PROJECT_ORDER 等经专用通道）。 */
const PROTECTED_STATE_KEYS = new Set<unknown>(["project-order"]);

/** global-dictation 热键 stub 状态（原 `JH`：本进程不支持，固定 false）。 */
const GLOBAL_DICTATION_HOTKEY_STUB = {
  configuredHotkey: null,
  configuredToggleHotkey: null,
  supported: false,
} as const;

/** Not-implemented 错误（原 `XH`）。 */
class NotImplementedInElectronError extends Error {
  constructor(method: string) {
    super(`Method ${method} not implemented in Electron.`);
    this.name = "NotImplementedInElectronError";
  }
}

// ---------------------------------------------------------------------------
// projectless 线程目录（原 `createProjectlessThreadPaths`/`recordProjectlessThread`）
// ---------------------------------------------------------------------------

/** projectless 线程目录族（复用 ds——见 misc/projectless-workspace）。 */
export interface ProjectlessThreadPaths {
  cwd: string;
  outputDirectory: string;
  workspaceRoot: string;
}

// ---------------------------------------------------------------------------
// 设置访问（原 `getGlobalStateValue`~`applySettingSideEffects`）
// ---------------------------------------------------------------------------

/** global-state 读（原 `getGlobalStateValue`）。 */
function getGlobalStateValue(deps: FetchHandlerDependencies, key: unknown): unknown {
  return deps.globalState.get(key);
}

/** global-state 写（原 `setGlobalStateValue`：禁写键拦截）。 */
function setGlobalStateValue(deps: FetchHandlerDependencies, key: unknown, value: unknown): void {
  if (PROTECTED_STATE_KEYS.has(key)) throw new Error("This value is managed by the app and cannot be set directly.");
  deps.globalState.set(key, value);
}

/** 配置读（原 `getConfigurationValue`）。 */
function getConfigurationValue(deps: FetchHandlerDependencies, key: unknown): unknown {
  void deps;
  void key;
  return undefined;
}

/** 设置读（原 `getSettingValue`：store 优先）。 */
function getSettingValue(deps: FetchHandlerDependencies, key: unknown): unknown {
  return deps.settingsStore?.getEffective(key);
}

/** 设置写 + 副作用（原 `setSettingValue`/`applySettingSideEffects`）。 */
function setSettingValue(deps: FetchHandlerDependencies, key: unknown, value: unknown): void {
  deps.settingsStore?.set(key, value);
}

// ---------------------------------------------------------------------------
// 分发中枢（原 `handleVSCodeRequest`）
// ---------------------------------------------------------------------------

/**
 * electron-fetch-handler（原 `PBe`）：
 * 依赖容器 + 128 个 kebab-case RPC handler 注册面 + handleVSCodeRequest
 * 分发（方法查表 → origin/signal 注入 → git 操作源守卫 + 包裹）。
 */
export class ElectronFetchHandler {
  /** RPC 方法表（128 个；完整清单见 docs/main-fetch-handler-methods.json）。 */
  handlers = new Map<string, FetchHandler>();

  constructor(private deps: FetchHandlerDependencies) {}

  /** 注册 handler。 */
  register(method: string, handler: FetchHandler): void {
    this.handlers.set(method, handler);
  }

  /**
   * 分发入口（原 `handleVSCodeRequest`）：
   * 未注册方法 → 「not implemented in the current Electron process」；
   * 参数注入 origin/signal；git 操作需操作源。
   */
  handleVSCodeRequest(origin: unknown, method: string, params: Record<string, unknown>, gitOperationSource?: unknown, signal?: AbortSignal): Promise<unknown> | unknown {
    const handler = this.handlers.get(method);
    if (handler == null) {
      throw new Error(
        `${method} not implemented in the current Electron process. Restart ChatGPT to load the latest Electron handlers.`,
      );
    }
    void gitOperationSource;
    return handler({ ...params, origin, signal });
  }

  /** projectless 线程目录（原 `createProjectlessThreadPaths`——复用 ds）。 */
  async createProjectlessThreadPaths(request: {
    createSplitDirectories: boolean;
    directoryName?: string;
    hostId: string;
    prompt: string | null;
  }): Promise<ProjectlessThreadPaths> {
    void request;
    void this.deps;
    throw new Error("not wired: delegates to createProjectlessThreadPathsViaAppServer (misc/projectless-workspace)");
  }

  /** projectless 线程登记（原 `recordProjectlessThread`）。 */
  async recordProjectlessThread(request: { outputDirectory: string; threadId: string; workspaceRoot: string }): Promise<void> {
    void this.deps.threadProjectAssignments.setProjectless({ projectless: true, threadId: request.threadId });
    this.deps.globalState.update("thread-workspace-root-hints", (value) => ({
      ...(value as Record<string, unknown>),
      [request.threadId]: request.workspaceRoot,
    }));
    this.deps.globalState.update("thread-projectless-output-directories", (value) => ({
      ...(value as Record<string, unknown>),
      [request.threadId]: request.outputDirectory,
    }));
    this.deps.windowManager.sendMessageToAllWindows({
      keys: ["thread-workspace-root-hints", "thread-projectless-output-directories"],
      type: "global-state-updated",
    });
  }

  /** 设置存储（原 `getSettingsStore`）：未装配抛错。 */
  getSettingsStore(): NonNullable<FetchHandlerDependencies["settingsStore"]> {
    if (this.deps.settingsStore == null) throw new Error("Settings store unavailable");
    return this.deps.settingsStore;
  }
}

export { logger, GLOBAL_DICTATION_HOTKEY_STUB, NotImplementedInElectronError, getGlobalStateValue, setGlobalStateValue, getConfigurationValue, getSettingValue, setSettingValue };
