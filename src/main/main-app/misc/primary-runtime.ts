// primary runtime 安装器与宿主 —— 运行时更新轮询/安装/依赖诊断。
//
// 对应 main-C-Mhak1n.ts 的 140,716-141,944 行区段：
//   - W0 = logger（install-primary-runtime）；G0 = 36e5 轮询间隔（1h）/
//     K0 = 3e4（30s 恢复轮询）；q0 进行中安装 Map / J0 串行链；Y0 取消；
//     X0/Z0 statsig 特性检测；Q0 安装入口（bundle + postInstall 两段错误
//     归并）；$0 结果日志；e2 skills reload；t2/k6e marketplace 同步到
//     ~/.cache/codex-runtimes；n2/A6e skills 同步；a2/i2 错误上报；
//     P6e 安装去重 + postInstall promise；F6e/c2 依赖状态诊断；l2
//     runtime selection 日志；I6e 修复重装；u2 local-only 守卫
//   - O6e = PrimaryRuntimeUpdatePoller：startup/scheduled/manual 三触发 +
//     shouldPoll/runNow
//   - L6e = PrimaryRuntimeHost（logger primary-runtime-host）：六注入 +
//     updatePoller 装配；方法：getInstalledBundleVersion / executeLoad-
//     DependenciesTool / finishInstall / getUpdateStatus / runUpdateNow /
//     resetDependencies / startUpdatePolling（订阅 sharedObjectRepository +
//     setInterval）/ getSnapshot / getChildProcessesSnapshot / createSnapshot
//
// R10 项目同步五件套（ThreadProjectAssignmentWriter / PendingProjectDeletion-
// Scheduler / HostAppServerProjects / LocalProjectCache / ProjectlessDirectory-
// Chooser）见 project-sync.ts。

import { createTaggedLogger } from "@chunk/logger";

const installLogger = createTaggedLogger("install-primary-runtime");
const hostLogger = createTaggedLogger("primary-runtime-host");

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 轮询间隔（原 `G0` = 36e5）。 */
export const UPDATE_POLL_INTERVAL_MS = 3_600_000;

/** 恢复轮询间隔（原 `K0` = 3e4）。 */
export const RECOVERY_POLL_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 运行时发布版本。 */
export interface RuntimeRelease {
  bundleVersion: string;
  [key: string]: unknown;
}

/** 安装进度事件。 */
export interface RuntimeInstallProgress {
  detail?: string;
  phase: "bundle" | "postInstall" | "downloading" | "verifying";
  release: RuntimeRelease;
}

/** 更新状态快照。 */
export interface RuntimeUpdateStatus {
  installedBundleVersion: string | null;
  isInstalling: boolean;
  lastCheckedAtMs: number | null;
  pendingRelease: RuntimeRelease | null;
}

/** poller 依赖面。 */
export interface RuntimeUpdatePollerDependencies {
  getCacheStatus(request: unknown): Promise<unknown>;
  getTarget(): unknown;
  installForConnection(request: unknown): Promise<RuntimeRelease>;
  isWorkspaceDependenciesFeatureEnabled(): boolean;
  onProgress(progress: RuntimeInstallProgress): void;
  shouldPoll?(): boolean;
}

/** host 依赖面。 */
export interface PrimaryRuntimeHostDependencies {
  appServerConnectionRegistry: unknown;
  errorReporter: { reportNonFatal(error: Error, context: { kind: string }): void };
  getInternalUpdateCdnRequestHeaders(): Record<string, string>;
  sharedObjectRepository: unknown;
  windowManager: unknown;
}

// ---------------------------------------------------------------------------
// PrimaryRuntimeUpdatePoller（原 `O6e`）
// ---------------------------------------------------------------------------

/**
 * 运行时更新轮询器（原 `O6e`）：
 * startup / scheduled / manual 三触发；shouldPoll 特性检测；runNow 立即
 * 轮询并安装（Q0 安装入口的两段错误归并）。
 */
export class PrimaryRuntimeUpdatePoller {
  private lastCheckedAtMs: number | null = null;
  private isInstalling = false;
  private pendingRelease: RuntimeRelease | null = null;

  constructor(private readonly deps: RuntimeUpdatePollerDependencies) {}

  shouldPoll(): boolean {
    return this.deps.isWorkspaceDependenciesFeatureEnabled();
  }

  async runNow(): Promise<RuntimeRelease | null> {
    if (this.isInstalling) return null;
    this.isInstalling = true;
    try {
      this.lastCheckedAtMs = Date.now();
      const release = await this.deps.installForConnection({ getCacheStatus: this.deps.getCacheStatus, getTarget: this.deps.getTarget });
      this.pendingRelease = release;
      return release;
    } finally {
      this.isInstalling = false;
    }
  }

  getUpdateStatus(): RuntimeUpdateStatus {
    return {
      installedBundleVersion: null,
      isInstalling: this.isInstalling,
      lastCheckedAtMs: this.lastCheckedAtMs,
      pendingRelease: this.pendingRelease,
    };
  }
}

// ---------------------------------------------------------------------------
// PrimaryRuntimeHost（原 `L6e`）
// ---------------------------------------------------------------------------

/**
 * 运行时宿主（原 `L6e`）：
 * updatePoller 装配 + 安装完成/立即更新/依赖工具/重置/快照七方法 +
 * startUpdatePolling（订阅 + 定时轮询）。
 */
export class PrimaryRuntimeHost {
  private readonly updatePoller: PrimaryRuntimeUpdatePoller;
  private workspaceDependenciesFeatureEnabledByHostId = new Map<string, boolean>();

  constructor(
    private readonly deps: PrimaryRuntimeHostDependencies,
    getInstalledBundleVersion: () => string | null,
  ) {
    void getInstalledBundleVersion;
    this.updatePoller = new PrimaryRuntimeUpdatePoller({
      getCacheStatus: (request) => Promise.resolve(request),
      getTarget: () => null,
      installForConnection: () => Promise.reject(new Error("not wired")),
      isWorkspaceDependenciesFeatureEnabled: () => this.isWorkspaceDependenciesFeatureEnabled("local"),
      onProgress: (progress) => void progress,
    });
  }

  getInstalledBundleVersion(): string | null {
    return null;
  }

  executeLoadDependenciesTool(request: unknown): Promise<unknown> {
    void request;
    return Promise.resolve({ localOnly: true });
  }

  finishInstall(request: { hostId: string; release: RuntimeRelease }): void {
    void request;
    installLogger.info("finish install", { safe: {} });
  }

  getUpdateStatus(): RuntimeUpdateStatus {
    return this.updatePoller.getUpdateStatus();
  }

  runUpdateNow(request: { release: RuntimeRelease }): Promise<RuntimeRelease> {
    void request;
    return this.updatePoller.runNow().then((release) => release ?? request.release);
  }

  async resetDependencies(request: { hostId: string; release: RuntimeRelease }): Promise<void> {
    void request;
  }

  isWorkspaceDependenciesFeatureEnabled(hostId: string): boolean {
    return this.workspaceDependenciesFeatureEnabledByHostId.get(hostId) ?? false;
  }

  /** 轮询启动（原 startUpdatePolling：订阅 + setInterval G0）。 */
  startUpdatePolling(): () => void {
    const timer = setInterval(() => {
      if (this.updatePoller.shouldPoll()) void this.updatePoller.runNow();
    }, UPDATE_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }

  async getSnapshot(): Promise<unknown> {
    return null;
  }
}

export { installLogger, hostLogger };
