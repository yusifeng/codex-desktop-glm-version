// artifact-session 宿主生命周期 —— 原 main-C-Mhak1n.ts 3,704-4,181 行
// （`Gr/Kr/qr/Lte/Rte/zte/Jr/Bte/Yr/Vte/Hte`）+ 4,358-4,432 行的进程 helpers
// （`ri/Jte/Yte/ii/ai/oi/Xte`，它们只被本类消费，随迁于此）。
//
// 职责：管理 artifact session 宿主守护进程（@oai/artifact-tool 的
// host-daemon.mjs）的完整生命周期：
//   - `ArtifactSessionHostLifecycle.start()`：校验参数 → 清理陈旧 runtime
//     generation → 首次启动尝试 → 装上失败重试定时器。
//   - 首个 viewer 监听者出现时才真正拉起守护进程（懒启动）；全部监听者
//     撤销后停掉进程（SIGTERM → 8s → SIGKILL）。
//   - viewer 连接信息变更回调 + admission（activate/status）握手；
//     启动期间用「监听者代数（#b 计数器）」防止并发注册/撤销导致的错配。
//   - 失败只 warning 并按 retryIntervalMs 重试（unref 定时器），start 的
//     Promise 结果被 memoize 到尝试结束。
//
// 可变状态（对应深析 §4）：全部为实例私有字段（#前缀），无模块级可变状态。
// Electron/子进程副作用均发生在调用期（构造无副作用）。

import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

import {
  wf as zObject,
  Cf as zNumber,
  Of as zString,
  gf as zBoolean,
  Sn as loadDefaultPrimaryRuntimePaths,
} from "@chunk/shared";
import { createTaggedLogger } from "@chunk/logger";
import {
  createAdmissionClient as defaultCreateAdmissionClient,
  removeArtifactSessionRuntime,
  pinArtifactToolRuntime,
  cleanStaleRuntimeGenerations,
  removeRuntimeDirectory,
  type AdmissionClient,
  type AdmissionStatus,
  type ArtifactSessionHostEnvironment,
  type HostConnectionInfo,
  type PinnedRuntimePaths,
  type SourceRuntimePaths,
} from "./runtime-install";

// ---- 常量（原 Gr..Bte/Yr/Vte，3,704-3,725）-----------------------------------

/** artifact-tool 包名（原 `Gr`）。 */
export const ARTIFACT_TOOL_PACKAGE_NAME = path.join(`@oai`, `artifact-tool`);
/** 宿主守护进程入口（原 `Kr`）。 */
export const ARTIFACT_TOOL_HOST_DAEMON_PATH = path.join(
  ARTIFACT_TOOL_PACKAGE_NAME,
  `dist`,
  `artifact-session`,
  `host-daemon.mjs`,
);
/** 宿主 client 入口（原 `qr`）。 */
export const ARTIFACT_TOOL_HOST_CLIENT_PATH = path.join(
  ARTIFACT_TOOL_PACKAGE_NAME,
  `dist`,
  `artifact-session`,
  `host-client.mjs`,
);
/** 启动失败重试间隔默认值（原 `Lte`，5s）。 */
const DEFAULT_RETRY_INTERVAL_MS = 5e3;
/** viewer 对账超时默认值（原 `Rte`，2s）。 */
const DEFAULT_VIEWER_RECONCILIATION_TIMEOUT_MS = 2e3;
/** 守护进程优雅停机宽限（原 `zte`，5s，传给 daemon env）。 */
const DAEMON_SHUTDOWN_GRACE_MS = 5e3;
/** 守护进程退出等待上限（原 `Jr`，8s；SIGTERM 后超时升级 SIGKILL）。 */
const PROCESS_EXIT_TIMEOUT_MS = 8e3;
/** runtime 快照最大尝试次数（原 `Bte`）。 */
export const RUNTIME_SNAPSHOT_MAX_ATTEMPTS = 3;

/** 守护进程环境变量键表（原 `Yr`）。 */
export const ARTIFACT_SESSION_HOST_ENV_KEYS = Object.freeze({
  adminToken: `ARTIFACT_SESSION_HOST_ADMIN_TOKEN`,
  exportRoot: `ARTIFACT_SESSION_HOST_EXPORT_ROOT`,
  mcpToken: `ARTIFACT_SESSION_HOST_MCP_TOKEN`,
  parentStdinLease: `ARTIFACT_SESSION_HOST_PARENT_STDIN_LEASE`,
  processExitTimeoutMs: `ARTIFACT_SESSION_HOST_PROCESS_EXIT_TIMEOUT_MS`,
  readyFile: `ARTIFACT_SESSION_HOST_READY_FILE`,
  requireAdmission: `ARTIFACT_SESSION_HOST_REQUIRE_ADMISSION`,
  shutdownGraceMs: `ARTIFACT_SESSION_HOST_SHUTDOWN_GRACE_MS`,
  socket: `ARTIFACT_SESSION_HOST_SOCKET`,
  store: `ARTIFACT_SESSION_HOST_STORE`,
  viewerToken: `ARTIFACT_SESSION_HOST_VIEWER_TOKEN`,
});

/** admission 状态 schema（原 `Vte`；epoch 非负整数、instanceId 非空、open 布尔）。 */
export const admissionStatusSchema = zObject({
  epoch: zNumber().int().nonnegative(),
  instanceId: zString().min(1),
  open: zBoolean(),
});

// ---- 类型 --------------------------------------------------------------------

/** viewer 连接信息监听器（null 表示连接信息失效）。 */
export type ViewerConnectionInfoListener = (
  info: (HostConnectionInfo & { runtimePaths?: unknown }) | null,
) => unknown;

/** viewer 连接信息（含 runtime 路径）。 */
export interface ViewerConnectionInfo extends HostConnectionInfo {
  runtimePaths?: PinnedRuntimePaths;
}

export interface ArtifactSessionHostLifecycleOptions {
  createAdmissionClient: (info: HostConnectionInfo) => Promise<AdmissionClient>;
  isEnabled(): boolean;
  loadPrimaryRuntimePaths(): Promise<SourceRuntimePaths | null | undefined>;
  retryIntervalMs: number;
  rootDirectory: string;
  startupTimeoutMs: number;
  temporaryDirectory: string;
  transactionKey: string;
  viewerReconciliationTimeoutMs: number;
}

export interface ArtifactSessionHostStartOptions {
  createAdmissionClient?: (info: HostConnectionInfo) => Promise<AdmissionClient>;
  isEnabled?(): boolean;
  loadPrimaryRuntimePaths?(): Promise<SourceRuntimePaths | null | undefined>;
  rootDirectory: string;
  primaryRuntimePaths?: SourceRuntimePaths;
  retryIntervalMs?: number;
  startupTimeoutMs?: number;
  temporaryDirectory?: string;
  viewerReconciliationTimeoutMs?: number;
}

export interface ArtifactSessionHostEnvironmentFactoryOptions {
  pinnedRuntimeDirectory: string;
  pinnedRuntimePaths: PinnedRuntimePaths;
  rootDirectory: string;
  runtimeDirectory: string;
  transactionKey: string;
  tokens: { admin: string; mcp: string; viewer: string };
}

/** Assemble the daemon environment and authenticated connection descriptors. */
export function createArtifactSessionHostEnvironment({
  pinnedRuntimeDirectory,
  pinnedRuntimePaths,
  rootDirectory,
  runtimeDirectory,
  transactionKey,
  tokens,
}: ArtifactSessionHostEnvironmentFactoryOptions): ArtifactSessionHostEnvironment {
  let daemonPath = path.join(pinnedRuntimePaths.nodeModulesPath, ARTIFACT_TOOL_HOST_DAEMON_PATH),
    socketPath = path.join(runtimeDirectory, `host.sock`),
    readyFile = path.join(runtimeDirectory, `ready`),
    hostClientModulePath = path.join(pinnedRuntimePaths.nodeModulesPath, ARTIFACT_TOOL_HOST_CLIENT_PATH),
    daemonEnv = Object.freeze({
      [ARTIFACT_SESSION_HOST_ENV_KEYS.adminToken]: tokens.admin,
      [ARTIFACT_SESSION_HOST_ENV_KEYS.exportRoot]: path.join(rootDirectory, `exports`),
      [ARTIFACT_SESSION_HOST_ENV_KEYS.mcpToken]: tokens.mcp,
      [ARTIFACT_SESSION_HOST_ENV_KEYS.parentStdinLease]: `1`,
      [ARTIFACT_SESSION_HOST_ENV_KEYS.processExitTimeoutMs]: String(PROCESS_EXIT_TIMEOUT_MS),
      [ARTIFACT_SESSION_HOST_ENV_KEYS.readyFile]: readyFile,
      [ARTIFACT_SESSION_HOST_ENV_KEYS.requireAdmission]: `1`,
      [ARTIFACT_SESSION_HOST_ENV_KEYS.shutdownGraceMs]: String(DAEMON_SHUTDOWN_GRACE_MS),
      [ARTIFACT_SESSION_HOST_ENV_KEYS.socket]: socketPath,
      [ARTIFACT_SESSION_HOST_ENV_KEYS.store]: path.join(rootDirectory, `store`),
      [ARTIFACT_SESSION_HOST_ENV_KEYS.viewerToken]: tokens.viewer,
    });
  return Object.freeze({
    adminConnectionInfo: Object.freeze({ hostClientModulePath, socketPath, token: tokens.admin }),
    daemonEnv,
    daemonPath,
    pinnedRuntimeDirectory,
    readyFile,
    runtimeDirectory,
    runtimePaths: pinnedRuntimePaths,
    trustedServiceEnv: Object.freeze({
      ARTIFACT_SESSION_HOST_MCP_TOKEN: tokens.mcp,
      ARTIFACT_SESSION_HOST_SOCKET: socketPath,
      ARTIFACT_SESSION_TRANSACTION_KEY: transactionKey,
      NODE_REPL_SANDBOX_ALLOWED_UNIX_SOCKETS: socketPath,
    }),
    viewerConnectionInfo: Object.freeze({ hostClientModulePath, socketPath, token: tokens.viewer }),
  });
}

// ---- 进程 helpers（原 ri/Jte/Yte/ii/ai/oi/Xte，4,358-4,432）--------------------

/** 32 字节随机 token（base64url；原 `ri`）。 */
function randomToken(): string {
  return randomBytes(32).toString(`base64url`);
}

/** 捕获子进程 stderr 尾部（最多 4096 字符；原 `Jte`）。 */
function captureStderrTail(child: { stderr?: { setEncoding(enc: string): void; on(event: string, cb: (chunk: string) => void): void } }) {
  let tail = ``;
  return (
    child.stderr?.setEncoding(`utf8`),
    child.stderr?.on(`data`, (chunk) => {
      tail = `${tail}${chunk}`.slice(-4096);
    }),
    () => tail
  );
}

/** 等待守护进程 ready 文件出现且内容等于预期 socket 路径（原 `Yte`，25ms 轮询）。 */
async function waitForDaemonReady({
  child,
  expectedSocketPath,
  readyFile,
  startupTimeoutMs,
}: {
  child: ChildProcess;
  expectedSocketPath: string;
  readyFile: string;
  startupTimeoutMs: number;
}) {
  let deadline = Date.now() + startupTimeoutMs,
    spawnError: Error | undefined;
  for (
    child.once(`error`, (error) => {
      spawnError = error;
    });
    Date.now() <= deadline;

  ) {
    if (spawnError != null) throw spawnError;
    if (child.exitCode != null || child.signalCode != null)
      throw Error(`daemon exited before becoming ready`);
    let reported = await fs
      .readFile(readyFile, `utf8`)
      .then((contents) => contents.trim())
      .catch(() => null);
    if (reported != null) {
      if (reported !== expectedSocketPath) throw Error(`daemon reported an unexpected socket path`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw Error(`timed out waiting for daemon readiness`);
}

/** 终止子进程：SIGTERM → PROCESS_EXIT_TIMEOUT_MS → SIGKILL（原 `ii`）。 */
async function terminateProcess(child: ChildProcess) {
  if (child.pid == null || child.exitCode != null || child.signalCode != null) return;
  let exited = new Promise<void>((resolve) => {
    let onDone = () => {
      (child.off(`close`, onDone), child.off(`error`, onDone), child.off(`exit`, onDone), resolve());
    };
    (child.once(`close`, onDone), child.once(`error`, onDone), child.once(`exit`, onDone));
  });
  child.kill(`SIGTERM`);
  let killTimer: ReturnType<typeof setTimeout> | undefined,
    exitedInTime = await Promise.race([
      exited.then(() => !0),
      new Promise<boolean>((resolve) => {
        killTimer = setTimeout(() => resolve(!1), PROCESS_EXIT_TIMEOUT_MS);
      }),
    ]);
  killTimer != null && clearTimeout(killTimer),
    !exitedInTime && child.exitCode == null && child.signalCode == null && (child.kill(`SIGKILL`), await exited);
}

/** unknown → 错误消息字符串（原 `ai`）。 */
function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 带超时的 promise 竞速（定时器 unref；原 `oi`）。 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(Error(message)), timeoutMs);
        timer.unref();
      }),
    ]);
  } finally {
    timer != null && clearTimeout(timer);
  }
}

/** 判定 Node 错误码（原 `Xte`；runtime-install 的 ni 复用）。 */
export function isNodeErrorCode(error: unknown, code: string): boolean {
  return typeof error == `object` && !!error && `code` in error && (error as any).code === code;
}

// ---- Hte：宿主生命周期类（3,726-4,181）-----------------------------------------

/**
 * artifact session 宿主守护进程生命周期管理（原 `Hte`）。
 * 由启动装配区在 whenReady 之后构造（深析 §7.6：构造/启动必须延迟到装配期）。
 */
export class ArtifactSessionHostLifecycle {
  logger = createTaggedLogger(`ArtifactSessionHostLifecycle`);
  // #e createAdmissionClient / #t isEnabled / #n loadPrimaryRuntimePaths
  #createAdmissionClient: ArtifactSessionHostLifecycleOptions[`createAdmissionClient`];
  #isEnabled: () => boolean;
  #loadPrimaryRuntimePaths: () => Promise<SourceRuntimePaths | null | undefined>;
  // #r retryIntervalMs / #i rootDirectory / #a startupTimeoutMs
  // #o temporaryDirectory / #s transactionKey / #c viewerReconciliationTimeoutMs
  #retryIntervalMs: number;
  #rootDirectory: string;
  #startupTimeoutMs: number;
  #temporaryDirectory: string;
  #transactionKey: string;
  #viewerReconciliationTimeoutMs: number;
  // 运行时状态
  #available = !1; // #l
  #hostProcess: ChildProcess | undefined; // #u
  #stopResult: Promise<void> | undefined; // #d
  #disposed = !1; // #f
  #disposePromise: Promise<void> | undefined; // #p
  #stopped = !1; // #m
  #hostEnvironment: ArtifactSessionHostEnvironment | undefined; // #h
  #retryTimer: ReturnType<typeof setTimeout> | undefined; // #g
  #startPromise: Promise<boolean> | undefined; // #_
  #admittedViewers = new Set<ViewerConnectionInfoListener>(); // #v
  #viewerAvailable = !1; // #y
  #listenerGeneration = 0; // #b
  #viewerListeners = new Set<ViewerConnectionInfoListener>(); // #x

  constructor({
    createAdmissionClient,
    isEnabled,
    loadPrimaryRuntimePaths,
    retryIntervalMs,
    rootDirectory,
    startupTimeoutMs,
    temporaryDirectory,
    transactionKey,
    viewerReconciliationTimeoutMs,
  }: ArtifactSessionHostLifecycleOptions) {
    this.#createAdmissionClient = createAdmissionClient;
    this.#isEnabled = isEnabled;
    this.#loadPrimaryRuntimePaths = loadPrimaryRuntimePaths;
    this.#retryIntervalMs = retryIntervalMs;
    this.#rootDirectory = rootDirectory;
    this.#startupTimeoutMs = startupTimeoutMs;
    this.#temporaryDirectory = temporaryDirectory;
    this.#transactionKey = transactionKey;
    this.#viewerReconciliationTimeoutMs = viewerReconciliationTimeoutMs;
  }

  static async start({
    createAdmissionClient = defaultCreateAdmissionClient,
    isEnabled = () => !0,
    loadPrimaryRuntimePaths,
    rootDirectory,
    primaryRuntimePaths,
    retryIntervalMs = DEFAULT_RETRY_INTERVAL_MS,
    startupTimeoutMs = 1e4,
    temporaryDirectory = os.tmpdir(),
    viewerReconciliationTimeoutMs = DEFAULT_VIEWER_RECONCILIATION_TIMEOUT_MS,
  }: ArtifactSessionHostStartOptions): Promise<ArtifactSessionHostLifecycle> {
    if (!path.isAbsolute(rootDirectory))
      throw Error(`Artifact Session host root must be absolute.`);
    if (process.platform === `win32`)
      throw Error(`Artifact Session host Unix-socket transport is not available on Windows.`);
    if (!Number.isFinite(retryIntervalMs) || retryIntervalMs <= 0)
      throw Error(`Artifact Session retry interval must be positive.`);
    if (!Number.isFinite(viewerReconciliationTimeoutMs) || viewerReconciliationTimeoutMs <= 0)
      throw Error(`Artifact Session viewer reconciliation timeout must be positive.`);
    if (primaryRuntimePaths !== void 0 && loadPrimaryRuntimePaths !== void 0)
      throw Error(`Artifact Session accepts fixed runtime paths or a runtime loader, not both.`);
    let transactionKey = randomToken();
    await cleanStaleRuntimeGenerations(rootDirectory);
    let lifecycle = new ArtifactSessionHostLifecycle({
      createAdmissionClient,
      isEnabled,
      loadPrimaryRuntimePaths:
        primaryRuntimePaths === void 0
          ? (loadPrimaryRuntimePaths ?? loadDefaultPrimaryRuntimePaths)
          : async () => primaryRuntimePaths,
      retryIntervalMs,
      rootDirectory,
      startupTimeoutMs,
      temporaryDirectory,
      transactionKey,
      viewerReconciliationTimeoutMs,
    });
    return (await lifecycle.#ensureStarted(), lifecycle.#scheduleRetry(), lifecycle);
  }

  getPrimaryRuntimePaths(): PinnedRuntimePaths {
    if (this.#hostEnvironment == null) throw Error(`Artifact Session host is unavailable.`);
    return this.#hostEnvironment.runtimePaths;
  }

  isAvailable() {
    return this.#available;
  }

  isViewerAvailable() {
    return this.#viewerAvailable;
  }

  getTrustedServiceEnv() {
    if (this.#hostEnvironment == null) throw Error(`Artifact Session host is unavailable.`);
    return this.#hostEnvironment.trustedServiceEnv;
  }

  getViewerConnectionInfo(): HostConnectionInfo {
    if (this.#hostEnvironment == null) throw Error(`Artifact Session host is unavailable.`);
    return this.#hostEnvironment.viewerConnectionInfo;
  }

  /** 注册 viewer 连接信息监听器（返回反注册函数；原 3,824-3,858）。 */
  onViewerConnectionInfoChanged(listener: ViewerConnectionInfoListener): () => void {
    if (this.#disposed || this.#stopped)
      return (
        Promise.resolve()
          .then(() => listener(null))
          .catch((error) => {
            this.logger.warning(`artifact_session_viewer_listener_failed`, {
              safe: {},
              sensitive: { error },
            });
          }),
        () => void 0
      );
    this.#viewerListeners.add(listener),
      (this.#listenerGeneration += 1),
      this.#available
        ? this.#reconcileViewerListener(listener)
        : this.#ensureStarted().then(() => {
            if (!this.#available && !this.#disposed && !this.#stopped && this.#viewerListeners.has(listener)) {
              this.#ensureStarted().then(() => this.#scheduleRetry());
              return;
            }
            this.#scheduleRetry();
          });
    let unsubscribed = !0;
    return () => {
      unsubscribed &&
        ((unsubscribed = !1),
        this.#viewerListeners.delete(listener) &&
          ((this.#listenerGeneration += 1),
          this.#admittedViewers.delete(listener),
          this.#available &&
            this.#admittedViewers.size === 0 &&
            this.#hostProcess != null &&
            this.#stopHostProcess(this.#hostProcess),
          this.#viewerListeners.size === 0 &&
            this.#retryTimer != null &&
            (clearTimeout(this.#retryTimer), (this.#retryTimer = void 0))));
    };
  }

  requestViewerReconciliation() {
    this.#disposed ||
      this.#stopped ||
      this.#hostProcess == null ||
      this.#stopHostProcess(this.#hostProcess);
  }

  dispose(): Promise<void> {
    return ((this.#disposePromise ??= this.#disposeInternal()), this.#disposePromise);
  }

  /** #S：确保启动尝试完成（memoize 到尝试结束）。 */
  async #ensureStarted(): Promise<boolean> {
    return this.#available || this.#disposed || this.#stopped
      ? this.#available
      : ((this.#startPromise ??= this.#attemptStart().finally(() => {
          this.#startPromise = void 0;
        })),
        this.#startPromise);
  }

  /** #C：一次完整启动尝试（admission 握手 + viewer 对账 + activate）。 */
  async #attemptStart(): Promise<boolean> {
    try {
      if (this.#viewerListeners.size === 0 || !this.#isEnabled()) return !1;
      let environment = this.#hostEnvironment;
      if (environment == null) {
        let runtimePaths = await this.#loadPrimaryRuntimePaths();
        if (runtimePaths == null || this.#disposed || this.#stopped || this.#viewerListeners.size === 0)
          return !1;
        if (((environment = await this.#prepareHostEnvironment(runtimePaths)), this.#disposed || this.#stopped || this.#viewerListeners.size === 0))
          return (await removeArtifactSessionRuntime(environment), !1);
        this.#hostEnvironment = environment;
      }
      let hostProcess = this.#hostProcess;
      if (hostProcess == null) {
        let spawned = await this.#spawnHostDaemon(environment);
        if (((hostProcess = spawned), this.#disposed || this.#stopped || this.#viewerListeners.size === 0))
          return (await terminateProcess(spawned), !1);
        this.#hostProcess = spawned;
        let onExit = (code: number | null, signal: string | null) => {
          this.#handleHostExit(spawned, code, signal);
        };
        if (
          (spawned.once(`exit`, onExit),
          spawned.on(`error`, (error) => {
            this.logger.warning(`artifact_session_host_process_error`, {
              safe: {},
              sensitive: { error },
            });
          }),
          spawned.exitCode != null || spawned.signalCode != null)
        )
          return (spawned.off(`exit`, onExit), onExit(spawned.exitCode, spawned.signalCode), !1);
      }
      let admissionClient = await this.#createAdmissionClient(
        environment.adminConnectionInfo,
      );
      try {
        if (
          this.#disposed ||
          this.#stopped ||
          this.#viewerListeners.size === 0 ||
          this.#hostProcess !== hostProcess ||
          hostProcess.exitCode != null ||
          hostProcess.signalCode != null
        )
          return !1;
        let beforeStatus = await admissionClient.status();
        if (
          this.#disposed ||
          this.#stopped ||
          this.#viewerListeners.size === 0 ||
          this.#hostProcess !== hostProcess ||
          hostProcess.exitCode != null ||
          hostProcess.signalCode != null
        )
          return !1;
        let listenerGeneration = this.#listenerGeneration,
          listeners = [...this.#viewerListeners];
        try {
          if (!(await this.#reconcileViewersForStart(environment.viewerConnectionInfo, listeners, listenerGeneration)))
            return !1;
        } catch (error) {
          throw (await this.#stopHostProcess(hostProcess), error);
        }
        for (let listener of listeners) this.#admittedViewers.add(listener);
        if (
          this.#disposed ||
          this.#stopped ||
          this.#listenerGeneration !== listenerGeneration ||
          this.#admittedViewers.size === 0 ||
          this.#hostProcess !== hostProcess ||
          hostProcess.exitCode != null ||
          hostProcess.signalCode != null
        )
          return !1;
        await admissionClient.activate(beforeStatus);
        let afterStatus = await admissionClient.status();
        if (
          this.#disposed ||
          this.#stopped ||
          this.#listenerGeneration !== listenerGeneration ||
          this.#admittedViewers.size === 0 ||
          this.#hostProcess !== hostProcess ||
          hostProcess.exitCode != null ||
          hostProcess.signalCode != null
        )
          return (await this.#stopHostProcess(hostProcess), !1);
        if (
          afterStatus.instanceId !== beforeStatus.instanceId ||
          afterStatus.epoch !== beforeStatus.epoch ||
          !(afterStatus as AdmissionStatus).open
        )
          throw Error(`Artifact Session host admission changed while activating.`);
      } finally {
        await admissionClient.close().catch(() => void 0);
      }
      return this.#disposed ||
        this.#stopped ||
        this.#viewerListeners.size === 0 ||
        this.#admittedViewers.size === 0 ||
        this.#hostProcess !== hostProcess ||
        hostProcess.exitCode != null ||
        hostProcess.signalCode != null
        ? !1
        : ((this.#available = !0), (this.#viewerAvailable = !0), !0);
    } catch (error) {
      return (
        (this.#available = !1),
        this.logger.warning(`artifact_session_host_start_deferred`, {
          safe: {},
          sensitive: { error },
        }),
        !1
      );
    }
  }

  /** #w：准备守护进程运行环境（临时目录 + 钉住 runtime + env/token 装配）。 */
  async #prepareHostEnvironment(runtimePaths: SourceRuntimePaths): Promise<ArtifactSessionHostEnvironment> {
    await fs.mkdir(this.#temporaryDirectory, { recursive: !0 });
    let runtimeDirectory = await fs.mkdtemp(
      path.join(this.#temporaryDirectory, `codex-artifact-session-`),
    );
    await fs.chmod(runtimeDirectory, 448);
    let pinnedRuntimeDirectory: string | undefined;
    try {
      let pinned = await pinArtifactToolRuntime({
          rootDirectory: this.#rootDirectory,
          sourceRuntimePaths: runtimePaths,
        }),
        { runtimePaths: pinnedRuntimePaths } = pinned;
      pinnedRuntimeDirectory = pinned.pinnedRuntimeDirectory;
      return createArtifactSessionHostEnvironment({
        pinnedRuntimeDirectory,
        pinnedRuntimePaths,
        rootDirectory: this.#rootDirectory,
        runtimeDirectory,
        transactionKey: this.#transactionKey,
        tokens: { admin: randomToken(), mcp: randomToken(), viewer: randomToken() },
      });
    } catch (error) {
      throw (
        pinnedRuntimeDirectory != null && (await removeRuntimeDirectory(pinnedRuntimeDirectory)),
        await fs.rm(runtimeDirectory, { recursive: !0, force: !0 }),
        error
      );
    }
  }

  /** #T：spawn 守护进程并等待 ready 文件（失败时附带 stderr 尾部）。 */
  async #spawnHostDaemon(environment: ArtifactSessionHostEnvironment) {
    await fs.rm(environment.readyFile, { force: !0 });
    let child = spawn(environment.runtimePaths.nodePath, [environment.daemonPath], {
        env: environment.daemonEnv,
        stdio: [`pipe`, `ignore`, `pipe`],
      }),
      stderrTail = captureStderrTail(child);
    try {
      return (
        await waitForDaemonReady({
          child,
          expectedSocketPath: environment.viewerConnectionInfo.socketPath,
          readyFile: environment.readyFile,
          startupTimeoutMs: this.#startupTimeoutMs,
        }),
        child
      );
    } catch (error) {
      await terminateProcess(child);
      let tail = stderrTail().trim();
      throw Error(
        tail.length === 0
          ? `Artifact Session host failed to start: ${errorToMessage(error)}`
          : `Artifact Session host failed to start: ${errorToMessage(error)} (${tail})`,
      );
    }
  }

  /** #E：失败后按 retryIntervalMs 重试（定时器 unref）。 */
  #scheduleRetry() {
    this.#available ||
      this.#disposed ||
      this.#stopped ||
      this.#viewerListeners.size === 0 ||
      this.#retryTimer != null ||
      ((this.#retryTimer = setTimeout(() => {
        (this.#retryTimer = void 0), this.#ensureStarted().then(() => this.#scheduleRetry());
      }, this.#retryIntervalMs)),
      this.#retryTimer.unref());
  }

  /** #D：停止守护进程（幂等；停止结果 promise 被 memoize）。 */
  #stopHostProcess(child: ChildProcess): Promise<void> {
    if (this.#stopped) return this.#stopResult ?? Promise.resolve();
    (this.#stopped = !0),
      (this.#available = !1),
      (this.#viewerAvailable = !1),
      this.#admittedViewers.clear(),
      this.#retryTimer != null && (clearTimeout(this.#retryTimer), (this.#retryTimer = void 0)),
      this.#notifyViewerListeners(null),
      this.#hostProcess === child && (this.#hostProcess = void 0);
    let stopPromise = terminateProcess(child).catch((error) => {
      this.logger.warning(`artifact_session_host_stop_failed`, {
        safe: {},
        sensitive: { error },
      });
    });
    return (
      (this.#stopResult = stopPromise),
      stopPromise.finally(() => {
        this.#stopResult === stopPromise && (this.#stopResult = void 0);
      }),
      stopPromise
    );
  }

  /** #O：守护进程 exit 回调（意外退出时通知全部 viewer）。 */
  #handleHostExit(
    child: ChildProcess,
    code: number | null,
    signal: string | null,
  ) {
    this.#hostProcess === child &&
      ((this.#available = !1),
      (this.#viewerAvailable = !1),
      (this.#stopped = !0),
      this.#admittedViewers.clear(),
      this.#retryTimer != null && (clearTimeout(this.#retryTimer), (this.#retryTimer = void 0)),
      this.#disposed ||
        this.logger.warning(`artifact_session_host_exited`, {
          safe: { code, signal },
          sensitive: {},
        }),
      (this.#hostProcess = void 0),
      this.#notifyViewerListeners(null));
  }

  /** #k：dispose 内部实现（等待在途启动/停止后杀进程 + 删除 runtime）。 */
  async #disposeInternal() {
    (this.#disposed = !0),
      (this.#available = !1),
      (this.#viewerAvailable = !1),
      this.#admittedViewers.clear(),
      this.#stopped || this.#notifyViewerListeners(null),
      this.#viewerListeners.clear(),
      this.#retryTimer != null && (clearTimeout(this.#retryTimer), (this.#retryTimer = void 0)),
      await this.#startPromise,
      await this.#stopResult,
      this.#hostProcess != null && (await terminateProcess(this.#hostProcess));
    let environment = this.#hostEnvironment;
    (this.#hostEnvironment = void 0),
      environment != null && (await removeArtifactSessionRuntime(environment));
  }

  /** #A：向全部 viewer 监听者派发连接信息（异常仅 warning）。 */
  #notifyViewerListeners(info: ViewerConnectionInfo | null) {
    for (let listener of this.#viewerListeners)
      Promise.resolve()
        .then(() => listener(info))
        .catch((error) => {
          this.logger.warning(`artifact_session_viewer_listener_failed`, {
            safe: {},
            sensitive: { error },
          });
        });
  }

  /** #j：启动路径上的 viewer 对账（超时 / 代数校验；原 4,136-4,148）。 */
  async #reconcileViewersForStart(
    viewerConnectionInfo: HostConnectionInfo,
    listeners: ViewerConnectionInfoListener[],
    listenerGeneration: number,
  ): Promise<boolean> {
    try {
      await withTimeout(
        Promise.all(
          listeners.map((listener) => Promise.resolve().then(() => listener(viewerConnectionInfo))),
        ),
        this.#viewerReconciliationTimeoutMs,
        `Artifact Session viewer reconciliation timed out.`,
      );
    } catch (error) {
      if (this.#listenerGeneration !== listenerGeneration) return !1;
      throw error;
    }
    return (
      listeners.length > 0 && this.#listenerGeneration === listenerGeneration && listeners.every((listener) => this.#viewerListeners.has(listener))
    );
  }

  /** #M：运行中对单个监听者对账（失败时停进程；原 4,149-4,179）。 */
  async #reconcileViewerListener(listener: ViewerConnectionInfoListener) {
    let hostProcess = this.#hostProcess,
      viewerConnectionInfo = this.#hostEnvironment?.viewerConnectionInfo;
    if (!(hostProcess == null || viewerConnectionInfo == null || this.#disposed || this.#stopped)) {
      try {
        await withTimeout(
          Promise.resolve().then(() => listener(viewerConnectionInfo)),
          this.#viewerReconciliationTimeoutMs,
          `Artifact Session viewer reconciliation timed out.`,
        );
      } catch (error) {
        this.#viewerListeners.has(listener) &&
          !this.#disposed &&
          !this.#stopped &&
          this.#hostProcess === hostProcess &&
          (this.logger.warning(`artifact_session_viewer_listener_failed`, {
            safe: {},
            sensitive: { error },
          }),
          await this.#stopHostProcess(hostProcess));
        return;
      }
      this.#viewerListeners.has(listener) &&
        !this.#disposed &&
        !this.#stopped &&
        this.#available &&
        this.#hostProcess === hostProcess &&
        hostProcess.exitCode == null &&
        hostProcess.signalCode == null &&
        this.#admittedViewers.add(listener);
    }
  }
}
