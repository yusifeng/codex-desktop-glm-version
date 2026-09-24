// SparkleManager —— 统一更新管理门面（原 bootstrap-C4dRql4x.ts 20991-21869 行的
// `zT/BT/VT/HT/UT/WT` 常量、`GT`、`KT`、`qT`、`JT`）。
//
// 职责（主进程侧，单实例，由 desktop-runtime 组装）：
//   - in-app updates 启动策略门：`initialize()` 打开 5 分钟的策略等待计时器，
//     `latchInAppUpdatesEnabledForLaunch()` 在窗口就绪后写入策略；`pending → allowed`
//     会级联触发更新器初始化（`initializeUpdater` 只执行一次，`initializeUpdaterOnce`）。
//     `checkForUpdates` / `installUpdatesIfAvailable` 在策略 resolve 之前会阻塞等待。
//   - 平台更新器装配：win32 → Windows Store / MSIX 组合（`initializeWindowsUpdater`），
//     linux → 包管理器更新器（`initializeLinuxPackageUpdater`），
//     darwin → Sparkle 框架（`initializeMacSparkle`，通过 `createRequire` 加载
//     `process.resourcesPath/native/sparkle.node` 并桥接全部 sink）。
//   - 更新生命周期状态机：`idle/checking/ready/installing` 与下载/安装进度、
//     downloaded-update app brand（`qT`）派发。
//   - Owl 托管强制重启策略（relaunch notice 窗口计算 + forced update 定时安装）。
//   - macOS 可执行文件身份比对：安装前发现 execPath 的 dev/ino 变化则先 relaunch。
//
// 注意：这是 macOS 上实际运行的更新器，语义与原始压缩代码逐行对齐
// （计时器 unref、Promise 竞速、`??=` 惰性初始化等时序细节均已保留）。

import { createRequire } from "node:module";
import { join } from "node:path";
import { statSync } from "node:fs";

import { app, ipcMain } from "electron";
// @chunk/shared（src-DldfpmrL.js，尚未重写）的压缩名导出，按语义重命名导入：
//   Ld → lodash isEqual（内部符号 s_，XC.default 的来源）
//   Hu → 语义版本 → Windows Store 四段式 build 版本规范化（内部符号 my）
//   ud → "codex" | "chatgpt" app 品牌解析（内部符号 rv，zod 枚举校验）
import { Ld as isEqual, Hu as normalizeWindowsStoreBuildVersion, ud as parseAppBrand } from "@chunk/shared";
import { createTaggedLogger, type Logger, type LogLevel } from "@chunk/logger";
import { BuildFlavor } from "../build-info/build-flavor";
import { readPackageMetadataField } from "../metadata/package-metadata";
import type { ProductionAppcastState } from "./production-appcast-state";
import { buildProductionAppcastUrl } from "./backend-appcast";
import { getOwlUpdatePolicies, getRelaunchNotificationPolicyFrom, computeRelaunchDeadline } from "./relaunch-policy";
import { LinuxPackageUpdater } from "./linux-package-updater";
import { MsixUpdater, loadWindowsUpdaterAddon } from "./windows-msix-updater";
import { WindowsStoreUpdater } from "./windows-store-updater";
import { WindowsCombinedUpdater } from "./windows-combined-updater";

/** 原生 sparkle.node / windows-updater.node 插件的 require（`RT`）。 */
const requireNative = createRequire(__filename);

// ---- 常量（原 zT/BT/VT/HT/UT/WT）------------------------------------------

/** in-app updates 启动策略等待超时（原 `zT`，5 分钟）。 */
const IN_APP_UPDATES_POLICY_TIMEOUT_MS = 3e5;
/** 调试用 relaunch 通知提前量（原 `BT`，5 小时）。 */
const RELAUNCH_NOTICE_DEBUG_LEAD_MS = 18e6;
/** 强制更新安装失败后的重试间隔（原 `VT`，1 分钟）。 */
const FORCED_UPDATE_RETRY_INTERVAL_MS = 6e4;
/** relaunch notice 的「可关闭」阈值（原 `HT`，24 小时）。 */
const RELAUNCH_NOTICE_DISMISSABLE_LEAD_MS = 864e5;
/** relaunch 截止时间对齐粒度（原 `UT`，3 分钟）。 */
const RELAUNCH_DEADLINE_ALIGNMENT_MS = 3;
/** 强制安装计时器单次最大等待（原 `WT`，2^31-1，Node setTimeout 上限）。 */
const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

// ---- 类型 ------------------------------------------------------------------

/** 更新生命周期状态（SparkleManager 状态机的取值）。 */
export type UpdateLifecycleState = "idle" | "checking" | "ready" | "installing";

/** in-app updates 启动策略状态。 */
type InAppUpdatesLaunchPolicy = "pending" | "allowed" | "denied";

/** 下载完成的更新所属 app 品牌（原 `qT` 的返回值）。 */
export type DownloadedUpdateAppBrand = "codex" | "chatgpt" | null;

/** Sparkle 查询参数（拼到 production appcast URL 上）。 */
export interface SparkleQueryParams {
  beta: boolean;
  planType: string;
}

/** 内部更新 CDN 请求头（受 Sparkle 侧 cookie 注入）。 */
export interface InternalUpdateCdnRequestHeaders {
  Cookie: string;
}

/** macOS 可执行文件身份（dev/ino 对，用于检测安装导致的文件替换）。 */
export interface MacExecutableIdentity {
  dev: number;
  ino: number;
}

/** relaunch 通知（托管策略要求在指定期限内完成重启）。 */
export interface RelaunchNotice {
  deadlineAtMs: number;
  dismissable: boolean;
  reportedAtMs: number;
}

/** 托管 relaunch 通知策略（来自 Owl 更新策略绑定）。 */
export interface RelaunchNotificationPolicy {
  relaunchNotification: number | null;
  relaunchNotificationPeriodMs: number | null;
  relaunchWindow: unknown;
  relaunchFastIfOutdatedDays: number | null;
}

/** Owl 更新策略对象（`process._linkedBinding("electron_browser_owl_update_policies")` 的返回形状）。 */
export interface OwlUpdatePolicies {
  getRelaunchNotificationPolicy(): unknown;
  on(event: string, listener: () => void): unknown;
}

/** 更新信息检查结果（安静模式，`checkForUpdateInformation`）。 */
// 注：windows/linux 更新器原样返回 `{ status: "up_to_date" }`（下划线，bootstrap
// 20308/20547 行），渲染侧也按下划线匹配——这里保持原始拼写。
export type UpdateInformationCheckResult =
  | { status: "unavailable"; reason: string }
  | { status: "busy" }
  | { status: "error"; reason: string }
  | { status: "restart_required" }
  | { status: "available"; availableVersion: string | null; availableBuildVersion: string }
  | { status: "up_to_date" };

/** 平台更新器的公共面（windows 组合更新器 / linux / mac sparkle 桥均满足）。 */
export interface PlatformUpdater {
  checkForUpdateInformation?(): Promise<UpdateInformationCheckResult>;
  checkForUpdates(): Promise<void> | void;
  installUpdatesIfAvailable(): Promise<void> | void;
}

/** installUpdates 请求参数：`{ quitImmediately: true }` 表示马上要退出。 */
export interface InstallUpdatesRequest {
  quitImmediately: boolean;
}

/** SparkleManager 构造选项（由 desktop-runtime 的组装函数传入）。 */
export interface SparkleManagerOptions {
  /** 该构建是否包含更新器（`BuildFlavor.shouldIncludeUpdater`）。 */
  enableUpdater: boolean;
  buildFlavor: string;
  isPackaged: boolean;
  /** 是否使用受限内部更新 CDN（当前组装传 `false`）。 */
  useInternalUpdateCdn: boolean;
  /** 为内部 CDN feed 取请求头；返回 `undefined`/`null` 表示未授权。 */
  getInternalUpdateCdnRequestHeaders?(
    feedUrl: string,
  ): Promise<InternalUpdateCdnRequestHeaders | null | undefined> | undefined;
  /** production appcast 状态存储（prod + darwin 且非 prod-internal 时才有）。 */
  productionAppcastStateStore?: ProductionAppcastState;
  onUpdateReadyChanged?(isReady: boolean): void;
  onInstallUpdatesRequested?(request?: InstallUpdatesRequest): void;
  onInstallUpdatesAborted?(): void;
  onInstallProgressChanged?(percent: number | null): void;
  onDownloadProgressChanged?(percent: number | null): void;
  onDownloadedUpdateAppBrandChanged?(brand: DownloadedUpdateAppBrand): void;
  onUpdateLifecycleStateChanged?(state: UpdateLifecycleState): void;
  onRelaunchNoticeChanged?(notice: RelaunchNotice | null): void;
  /** IPC 事件可信性检查（`codex_desktop:check-for-updates` handler 用）。 */
  isTrustedIpcEvent(event: unknown): boolean;
  /** macOS 可执行文件身份读取注入（测试用；缺省 statSync(execPath)）。 */
  getMacExecutableIdentity?(): MacExecutableIdentity | null;
}

/** 原生 Sparkle 插件面（native/sparkle.node 导出；sink 均为可选防御式探测）。 */
interface SparkleAddon {
  init(feedUrl: string, headers?: unknown, fallbackFeedUrl?: string): void;
  checkForUpdates(): void;
  checkForUpdatesInBackground(): void;
  checkForUpdateInformation(): void;
  installUpdatesIfAvailable(): void;
  installLatestUpdate?(): void;
  setAutomaticBackgroundDownloadsEnabled(enabled: boolean): void;
  setLogSink?(listener: (level: number, message: string) => void): void;
  setInstallUpdatesRequestedSink?(listener: (request?: InstallUpdatesRequest) => void): void;
  setUpdateCheckResultSink?(listener: (result: unknown) => void): void;
  setDownloadProgressSink?(listener: (percent: number | null) => void): void;
  setUpdateReadySink?(listener: (isReady: boolean) => void): void;
  setUpdateDownloadedSink?(listener: (isReady: boolean, appName: string | null) => void): void;
  setUpdateLifecycleStateSink?(listener: (state: string) => void): void;
  setCookieHeader(cookie: string): void;
}

// ---- 模块级辅助函数（原 qT / JT / GT）--------------------------------------

/**
 * 从 Sparkle 上报的 app 名称里解析下载更新的 app 品牌（原 `qT`）。
 * 匹配 `^(ChatGPT|Codex)(?: \([^)]+\))?-darwin-`，失败返回 `null`。
 */
export function parseDownloadedUpdateAppBrand(appName: string | null): DownloadedUpdateAppBrand {
  const match = appName?.match(/^(ChatGPT|Codex)(?: \([^)]+\))?-darwin-/)?.[1];
  return parseAppBrand(match?.toLowerCase() ?? null);
}

/**
 * 构造 Windows Store MSIX 回退包 URL（原 `JT`）：
 * `<manifestUrl>/releases/<encodeURIComponent(buildVersion)>/ChatGPT-<arch>.msix`。
 */
export function windowsStoreMsixPackageUrl(storeUpdateManifestUrl: string, buildVersion: string): string {
  return new URL(
    `releases/${encodeURIComponent(buildVersion)}/ChatGPT-${process.arch}.msix`,
    storeUpdateManifestUrl,
  ).toString();
}

/**
 * 读取 Sparkle 后台检查间隔（原 `GT`）：`SPARKLE_UPDATE_INTERVAL_MINUTES` 环境变量，
 * 缺省 15 分钟（9e5）；非数字同缺省；`<= 0` 表示禁用周期检查（返回 0）。
 */
export function updateIntervalMinutes(): number {
  const raw = process.env.SPARKLE_UPDATE_INTERVAL_MINUTES;
  if (!raw) return 9e5;
  const minutes = Number(raw);
  return Number.isFinite(minutes) ? (minutes <= 0 ? 0 : minutes * 60 * 1e3) : 9e5;
}

// ---- SparkleManager 本体（原 `KT`，21004-21862）----------------------------

export class SparkleManager {
  options: SparkleManagerOptions;
  prepareWindowsUpdate: (() => Promise<void>) | null = null;
  private logger: Logger = createTaggedLogger(`sparkle`);

  /** in-app updates 启动策略状态机。 */
  private inAppUpdatesLaunchPolicy: InAppUpdatesLaunchPolicy = `pending`;
  private latestInAppUpdatesEnabled: boolean | null = null;
  private inAppUpdatesLaunchPolicyResolution = Promise.withResolvers<void>();
  private inAppUpdatesLaunchPolicyTimer: NodeJS.Timeout | null = null;

  /** 更新器初始化（`??=` 单次）。 */
  private updaterInitialization: Promise<void> | null = null;
  private updater: PlatformUpdater | null = null;
  private informationCheck: Promise<UpdateInformationCheckResult> | null = null;

  /** 更新生命周期状态。 */
  private isUpdateReady = false;
  private updateLifecycleState: UpdateLifecycleState = `idle`;
  private downloadProgressPercent: number | null = null;
  private installProgressPercent: number | null = null;
  private lastUnavailableReason: string | null = null;
  private updateDownloadedAtMs: number | null = null;
  private downloadedUpdateAppBrand: DownloadedUpdateAppBrand = null;

  /** 强制更新（托管 relaunch 策略）。 */
  private forcedUpdateTimer: NodeJS.Timeout | null = null;
  private forcedUpdateInstallStarted = false;
  private forcedUpdateRetryAtMs: number | null = null;

  /** Owl 托管更新策略（可能不存在——非 Owl shell 或无该绑定）。 */
  private owlUpdatePolicies: OwlUpdatePolicies | null = null;
  private relaunchNotice: RelaunchNotice | null = null;

  /** Sparkle 相关状态。 */
  private automaticBackgroundDownloadsEnabled = false;
  private sparkleQueryParams: SparkleQueryParams = { beta: false, planType: `unknown` };
  private pendingSparkleQueryParams: SparkleQueryParams | null = null;
  private productionSparkle: SparkleAddon | null = null;

  /** 启动时的 macOS 可执行文件身份（安装检测用）。 */
  private macExecutableIdentityAtLaunch: MacExecutableIdentity | null = null;

  /** darwin 专用的后台下载开关桥（initializeMacSparkle 里赋值）。 */
  private setAutomaticBackgroundDownloadsEnabledForMac: ((enabled: boolean) => void) | null = null;

  constructor(options: SparkleManagerOptions) {
    this.options = options;
  }

  /**
   * 初始化更新器门面（主流程 `sparkleManager.initialize()` 调用点）。
   *
   * 更新器未启用：记录 unavailable 原因并立即 resolve 策略门。
   * 启用时：注册 `codex_desktop:check-for-updates` IPC handler，并启动
   * 5 分钟的 in-app updates 策略等待计时器（超时即按 `allowed` 放行）。
   */
  async initialize(): Promise<void> {
    if (!this.options.enableUpdater) {
      this.lastUnavailableReason =
        process.platform !== `darwin` && process.platform !== `win32`
          ? `unsupported platform`
          : `disabled for build flavor (${this.options.buildFlavor})`;
      this.inAppUpdatesLaunchPolicyResolution.resolve(undefined);
      return;
    }

    ipcMain.handle(`codex_desktop:check-for-updates`, async (event) => {
      if (this.options.isTrustedIpcEvent(event)) await this.checkForUpdates();
    });

    this.logger.info(`in_app_updates_policy_wait_started`, {
      safe: { timeoutMs: IN_APP_UPDATES_POLICY_TIMEOUT_MS },
      sensitive: {},
    });
    this.inAppUpdatesLaunchPolicyTimer = setTimeout(() => {
      this.inAppUpdatesLaunchPolicyTimer = null;
      this.logger.info(`in_app_updates_policy_timeout`, {
        safe: {
          timeoutMs: IN_APP_UPDATES_POLICY_TIMEOUT_MS,
          policy: this.inAppUpdatesLaunchPolicy,
        },
        sensitive: {},
      });
      void this.allowInAppUpdatesForLaunch();
    }, IN_APP_UPDATES_POLICY_TIMEOUT_MS);
    this.inAppUpdatesLaunchPolicyTimer.unref();
  }

  /** 窗口就绪后写入 in-app updates 策略（renderer 上报）。 */
  async latchInAppUpdatesEnabledForLaunch(enabled: boolean): Promise<void> {
    this.latestInAppUpdatesEnabled = enabled;
    this.logger.info(`in_app_updates_policy_latch`, {
      safe: {
        enabled,
        policy: this.inAppUpdatesLaunchPolicy,
        ignored: this.inAppUpdatesLaunchPolicy !== `pending`,
      },
      sensitive: {},
    });
    if (this.inAppUpdatesLaunchPolicy === `pending`) {
      if (enabled) {
        await this.allowInAppUpdatesForLaunch();
        return;
      }
      this.clearInAppUpdatesLaunchPolicyTimer();
      this.inAppUpdatesLaunchPolicy = `denied`;
      this.inAppUpdatesLaunchPolicyResolution.resolve(undefined);
    }
  }

  /** 启动失败恢复：无条件按 `allowed` 放行并初始化更新器（主流程 catch 路径）。 */
  async startUpdaterAfterStartupFailure(): Promise<void> {
    this.logger.info(`in_app_updates_policy_startup_recovery`, {
      safe: { policy: this.inAppUpdatesLaunchPolicy },
      sensitive: {},
    });
    await this.allowInAppUpdatesForLaunch();
  }

  /** 策略与窗口上报不一致时为 true（供 UI 提示策略变化）。 */
  hasInAppUpdatesPolicyChanges(): boolean {
    if (!this.options.enableUpdater) return false;
    switch (this.inAppUpdatesLaunchPolicy) {
      case `allowed`:
        return this.latestInAppUpdatesEnabled === false;
      case `denied`:
        return this.latestInAppUpdatesEnabled === true;
      case `pending`:
        return false;
    }
  }

  hasUpdater(): boolean {
    return this.updater != null;
  }

  /** 放行 in-app updates（幂等；`denied` 后不可再放行）。 */
  private async allowInAppUpdatesForLaunch(): Promise<void> {
    if (this.inAppUpdatesLaunchPolicy === `denied`) return;
    this.clearInAppUpdatesLaunchPolicyTimer();
    this.inAppUpdatesLaunchPolicy = `allowed`;
    this.inAppUpdatesLaunchPolicyResolution.resolve(undefined);
    await this.initializeUpdater();
  }

  /** 初始化更新器（`??=` 保证只跑一次；禁用时为空 Promise）。 */
  private initializeUpdater(): Promise<void> {
    return this.options.enableUpdater
      ? ((this.updaterInitialization ??= this.initializeUpdaterOnce()), this.updaterInitialization)
      : Promise.resolve();
  }

  /** 按平台装配一次更新器；失败仅记录原因，不抛出。 */
  private async initializeUpdaterOnce(): Promise<void> {
    try {
      if (process.platform === `win32`) {
        await this.initializeWindowsUpdater();
      } else if (process.platform === `linux`) {
        this.initializeLinuxPackageUpdater();
      } else {
        await this.initializeMacSparkle();
      }
      if (this.hasUpdater()) {
        this.observeRelaunchNotificationPolicy();
        if (this.getSupportsAutoInstallWhenIdle()) {
          this.options.onUpdateLifecycleStateChanged?.(this.updateLifecycleState);
        }
        return;
      }
      this.logger.warning(`Updater unavailable after init.`, {
        safe: {
          platform: process.platform,
          packaged: this.options.isPackaged,
          reason: this.lastUnavailableReason,
        },
        sensitive: {},
      });
    } catch (error) {
      this.logger.error(`Failed to set up updater`, { safe: {}, sensitive: { error } });
      this.lastUnavailableReason = `updater initialization failed`;
      this.updater = null;
    }
  }

  private clearInAppUpdatesLaunchPolicyTimer(): void {
    if (this.inAppUpdatesLaunchPolicyTimer != null) {
      clearTimeout(this.inAppUpdatesLaunchPolicyTimer);
      this.inAppUpdatesLaunchPolicyTimer = null;
    }
  }

  getIsUpdateReady(): boolean {
    return this.isUpdateReady;
  }

  getSupportsAutoInstallWhenIdle(): boolean {
    return false;
  }

  getIsDownloadedUpdateReady(): boolean {
    return (
      this.getSupportsAutoInstallWhenIdle() &&
      this.isUpdateReady &&
      this.updateDownloadedAtMs != null &&
      this.updateLifecycleState === `ready`
    );
  }

  getInstallProgressPercent(): number | null {
    return this.installProgressPercent;
  }

  getDownloadProgressPercent(): number | null {
    return this.downloadProgressPercent;
  }

  getDownloadedUpdateAppBrand(): DownloadedUpdateAppBrand {
    return this.downloadedUpdateAppBrand;
  }

  getUpdateLifecycleState(): UpdateLifecycleState {
    return this.updateLifecycleState;
  }

  /** 当前 relaunch 通知（每次都基于 deadline 重算 dismissable/reportedAt）。 */
  getRelaunchNotice(): RelaunchNotice | null {
    return this.relaunchNotice == null
      ? null
      : this.createRelaunchNotice(this.relaunchNotice.deadlineAtMs);
  }

  /** 调试：把 relaunch 通知的 deadline 提前到 5 小时后。 */
  showRelaunchNoticeForDebug(): void {
    this.setRelaunchNotice(Date.now() + RELAUNCH_NOTICE_DEBUG_LEAD_MS);
  }

  /**
   * 安静模式检查更新信息（带 30 秒超时与并发去重）。
   * 策略为 `denied` 时直接返回 unavailable；更新器未就绪时返回其 unavailable 原因。
   */
  async checkForUpdateInformation(): Promise<UpdateInformationCheckResult> {
    if (this.inAppUpdatesLaunchPolicy === `denied`) {
      return { status: `unavailable`, reason: `In-app updates are disabled by policy.` };
    }
    if (!this.updater?.checkForUpdateInformation) {
      return {
        status: `unavailable`,
        reason: this.lastUnavailableReason ?? `The updater is not initialized yet.`,
      };
    }
    if (this.informationCheck != null) return { status: `busy` };

    const check = this.updater.checkForUpdateInformation().catch(
      (error): UpdateInformationCheckResult => (
        this.logger.warning(`Quiet update check failed`, { safe: {}, sensitive: { error } }),
        { status: `error`, reason: `The updater could not check for updates.` }
      ),
    );
    this.informationCheck = check;
    void check.then(() => {
      this.informationCheck = null;
    });
    return new Promise((resolve) => {
      const timeout = setTimeout(
        () => resolve({ status: `error`, reason: `The update check timed out.` }),
        3e4,
      );
      void check.then((result) => {
        clearTimeout(timeout);
        resolve(result);
      });
    });
  }

  /**
   * 手动检查更新（IPC / 启动失败对话框调用）。
   * 先等 in-app updates 策略 resolve；`denied` 时静默跳过。
   */
  async checkForUpdates(): Promise<void> {
    await this.inAppUpdatesLaunchPolicyResolution.promise;
    if (this.inAppUpdatesLaunchPolicy === `denied`) return;

    await this.allowInAppUpdatesForLaunch();
    if (!this.updater) {
      this.logger.warning(`Update check request ignored (updater unavailable).`);
      return;
    }
    try {
      await this.updater.checkForUpdates();
    } catch (error) {
      if (
        this.updateLifecycleState === `checking` &&
        !this.isUpdateReady
      ) {
        this.setUpdateLifecycleState(`idle`);
      }
      this.logger.error(`Failed to check for updates`, { safe: {}, sensitive: { error } });
    }
  }

  /**
   * 安装已下载的更新（若可用）。返回是否成功发起/完成安装。
   * win32 上若更新器未报告安装进度则视为中止（回调 `onInstallUpdatesAborted`）。
   */
  async installUpdatesIfAvailable(): Promise<boolean> {
    await this.inAppUpdatesLaunchPolicyResolution.promise;
    if (this.inAppUpdatesLaunchPolicy === `denied`) return false;

    await this.allowInAppUpdatesForLaunch();
    if (!this.updater) {
      this.logger.warning(`Update install request ignored (updater unavailable).`);
      return false;
    }
    try {
      if (this.informationCheck == null) {
        if (this.isUpdateReady && process.platform !== `darwin`) {
          this.setUpdateLifecycleState(`installing`);
        }
        await this.updater.installUpdatesIfAvailable();
      }
      if (process.platform === `win32` && this.installProgressPercent == null) {
        this.setUpdateLifecycleState(this.isUpdateReady ? `ready` : `idle`);
        this.options.onInstallUpdatesAborted?.();
        return false;
      }
      return true;
    } catch (error) {
      this.setUpdateLifecycleState(this.isUpdateReady ? `ready` : `idle`);
      this.options.onInstallUpdatesAborted?.();
      this.logger.error(`Failed to install update`, { safe: {}, sensitive: { error } });
      return false;
    }
  }

  getUnavailableReason(): string | null {
    return this.inAppUpdatesLaunchPolicy === `denied`
      ? `disabled by update policy`
      : this.lastUnavailableReason;
  }

  /** 更新 Sparkle 查询参数（beta / planType），变化时热重配 production appcast。 */
  setSparkleQueryParams(params: SparkleQueryParams): void {
    if (
      !(
        isEqual(this.sparkleQueryParams, params) &&
        this.pendingSparkleQueryParams == null
      )
    ) {
      this.sparkleQueryParams = params;
      this.applySparkleQueryParams();
    }
  }

  /** 开关自动后台下载（darwin 透传给 Sparkle）。 */
  setAutomaticBackgroundDownloadsEnabled(enabled: boolean): void {
    if (this.automaticBackgroundDownloadsEnabled === enabled) return;
    this.automaticBackgroundDownloadsEnabled = enabled;
    this.setAutomaticBackgroundDownloadsEnabledForMac?.(enabled);
  }

  /** 用当前查询参数重配 production appcast（不可重配时挂起 pending）。 */
  private applySparkleQueryParams(): void {
    const store = this.options.productionAppcastStateStore;
    const productionSparkle = this.productionSparkle;
    if (store != null && productionSparkle != null) {
      if (!this.canReconfigureProductionAppcast()) {
        this.pendingSparkleQueryParams = this.sparkleQueryParams;
        return;
      }
      try {
        const feedUrl = buildProductionAppcastUrl({
          beta: this.sparkleQueryParams.beta,
          installationId: store.getOrCreateInstallationId(),
          planType: this.sparkleQueryParams.planType,
        });
        if (feedUrl == null) return;
        productionSparkle.init(feedUrl);
        this.pendingSparkleQueryParams = null;
        this.lastUnavailableReason = null;
      } catch (error) {
        this.logger.error(`Failed to update production appcast plan`, {
          safe: {},
          sensitive: { error },
        });
      }
    }
  }

  /** 只有在无更新就绪、无下载进度、状态机回到 idle 时才可重配 appcast。 */
  private canReconfigureProductionAppcast(): boolean {
    return (
      !this.isUpdateReady &&
      this.downloadProgressPercent == null &&
      this.updateLifecycleState === `idle`
    );
  }

  // ---- win32 装配（Windows Store / MSIX 组合）------------------------------

  private async initializeWindowsUpdater(): Promise<void> {
    const nativeAddon = loadWindowsUpdaterAddon();
    if (!nativeAddon) {
      this.lastUnavailableReason = `failed to load native windows updater`;
      return;
    }

    const checkIntervalMs = updateIntervalMinutes();
    const sharedCallbacks = {
      nativeAddon,
      onBeforeInstall: async () => {
        await this.prepareWindowsUpdate?.();
      },
      onUpdateReadyChanged: (isReady: boolean) => {
        this.setUpdateReady(isReady);
      },
      onDownloadProgressChanged: (percent: number | null) => {
        this.setDownloadProgressPercent(percent);
      },
      onInstallProgressChanged: (percent: number | null) => {
        this.setInstallProgressPercent(percent);
      },
      onUpdateLifecycleStateChanged: (state: UpdateLifecycleState) => {
        this.setUpdateLifecycleState(state);
      },
    };

    const packageIdentity = readPackageMetadataField(`codexWindowsPackageIdentity`)?.trim() ?? ``;
    const storeConfig = BuildFlavor.getWindowsStoreConfig(
      this.options.buildFlavor,
      packageIdentity,
    );
    const packagePublisher = readPackageMetadataField(`codexWindowsPackagePublisher`)?.trim() ?? ``;

    let updater: WindowsCombinedUpdater | WindowsStoreUpdater | MsixUpdater;
    if (storeConfig != null) {
      const archSupported = process.arch === `x64` || process.arch === `arm64`;
      let combinedUpdater: WindowsCombinedUpdater | null = null;
      // x64/arm64：组合更新器把 store ready 信号合并到 msix 回退上。
      const onCombinedUpdateReadyChanged = (isReady: boolean) => {
        this.setUpdateReady(combinedUpdater?.getIsUpdateReady() ?? false);
      };

      const storeUpdater = new WindowsStoreUpdater({
        storeProductId: storeConfig.storeProductId,
        storeUpdateManifestUrl: storeConfig.storeUpdateManifestUrl,
        buildVersion: this.resolveWindowsStoreBuildVersion(),
        packageIdentity,
        onInstallUpdatesRequested: this.options.onInstallUpdatesRequested,
        checkIntervalMs: archSupported ? 0 : checkIntervalMs,
        checkOnInitialize: !archSupported,
        ...sharedCallbacks,
        onUpdateReadyChanged: archSupported
          ? onCombinedUpdateReadyChanged
          : sharedCallbacks.onUpdateReadyChanged,
      });

      if (archSupported) {
        combinedUpdater = new WindowsCombinedUpdater({
          checkIntervalMs,
          storeUpdater,
          msixFallbackUpdater: new MsixUpdater({
            allowServiceInstallElevation: true,
            manifestUrl: storeConfig.storeUpdateManifestUrl,
            getPackageUrlForBuildVersion: (buildVersion: string) =>
              windowsStoreMsixPackageUrl(storeConfig.storeUpdateManifestUrl, buildVersion),
            buildVersion: this.resolveWindowsStoreBuildVersion(),
            packageIdentity,
            packagePublisher,
            checkIntervalMs: 0,
            checkForUpdatesOnInitialize: false,
            ...sharedCallbacks,
            onUpdateReadyChanged: onCombinedUpdateReadyChanged,
          }),
        });
        updater = combinedUpdater;
      } else {
        updater = storeUpdater;
      }
    } else {
      const updateUrl = this.resolveWindowsUpdateUrl();
      if (!updateUrl) return;
      updater = new MsixUpdater({
        manifestUrl: updateUrl,
        allowServiceInstallElevation: true,
        buildVersion: this.resolveBuildVersion(),
        packageIdentity,
        packagePublisher,
        checkIntervalMs,
        ...sharedCallbacks,
      });
    }

    await updater.initialize();
    if (!updater.hasUpdater()) {
      this.lastUnavailableReason = updater.getUnavailableReason();
      return;
    }
    this.lastUnavailableReason = null;
    this.updater = updater;
    this.setUpdateReady(updater.getIsUpdateReady());
    this.setInstallProgressPercent(null);
  }

  // ---- linux 装配（包管理器）----------------------------------------------

  private initializeLinuxPackageUpdater(): void {
    const updater = new LinuxPackageUpdater({
      buildFlavor: this.options.buildFlavor,
      executablePath: process.execPath,
      isPackaged: this.options.isPackaged,
      runningVersion: app.getVersion(),
      onInstallUpdatesRequested: () => {
        this.options.onInstallUpdatesRequested?.();
      },
      onUpdateReadyChanged: (isReady) => {
        this.setUpdateReady(isReady);
      },
    });
    updater.initialize();
    if (!updater.hasUpdater()) {
      this.lastUnavailableReason = updater.getUnavailableReason();
      return;
    }
    this.lastUnavailableReason = null;
    this.updater = updater;
  }

  // ---- darwin 装配（Sparkle 框架）------------------------------------------

  private async initializeMacSparkle(): Promise<void> {
    if (process.platform !== `darwin`) {
      this.lastUnavailableReason = `unsupported platform`;
      return;
    }
    if (!this.options.isPackaged) {
      this.lastUnavailableReason = `dev build`;
      return;
    }

    this.macExecutableIdentityAtLaunch = this.readMacExecutableIdentity();

    // production appcast（backend feed）优先，否则用打包进 package.json 的 feed。
    const appcastStore =
      this.options.buildFlavor === BuildFlavor.Prod && this.options.productionAppcastStateStore != null
        ? this.options.productionAppcastStateStore
        : null;
    const usesProductionAppcast = appcastStore != null;

    let feedUrl: string | null;
    let legacyFeedUrl: string | null = null;
    let requestHeaders: InternalUpdateCdnRequestHeaders | false | undefined;

    if (appcastStore != null) {
      const productionFeedUrl = buildProductionAppcastUrl({
        beta: this.sparkleQueryParams.beta,
        installationId: appcastStore.getOrCreateInstallationId(),
        planType: this.sparkleQueryParams.planType,
      });
      if (productionFeedUrl == null) {
        this.lastUnavailableReason = `production sparkle feed unavailable`;
        return;
      }
      feedUrl = productionFeedUrl;
    } else {
      const packagedFeedUrl = this.resolveMacSparkleFeedUrl();
      if (packagedFeedUrl == null) return;
      const internalCdnFeedUrl = this.options.useInternalUpdateCdn
        ? this.resolveMacSparkleInternalCdnFeedUrl()
        : null;
      feedUrl = internalCdnFeedUrl ?? packagedFeedUrl;
      legacyFeedUrl = internalCdnFeedUrl ? packagedFeedUrl : null;
      requestHeaders = internalCdnFeedUrl
        ? await this.getInternalUpdateCdnRequestHeaders(feedUrl)
        : undefined;
      // 内部 CDN 授权失败：回退到 legacy feed。
      if (requestHeaders === false) {
        feedUrl = packagedFeedUrl;
        legacyFeedUrl = null;
      }
    }

    // 加载原生 Sparkle 插件。
    let sparkle: SparkleAddon | null = null;
    let loadError: unknown;
    try {
      sparkle = requireNative(join(process.resourcesPath, `native`, `sparkle.node`));
    } catch (error) {
      loadError = error;
    }
    if (!sparkle) {
      this.logger.error(`Failed to load native Sparkle addon`, {
        safe: {},
        sensitive: { error: loadError },
      });
      this.lastUnavailableReason = `failed to load native sparkle addon`;
      return;
    }

    // 桥接 sink（全部防御式探测——旧版插件可能缺少部分接口）。
    let updateCheckResultCallback: ((result: unknown) => void) | null = null;
    const setUpdateLifecycleStateSink = sparkle.setUpdateLifecycleStateSink;
    const hasLifecycleStateSink = typeof setUpdateLifecycleStateSink == `function`;

    try {
      if (typeof sparkle.setLogSink == `function`) {
        sparkle.setLogSink((level, message) => {
          this.logger.log(this.decodeNativeLogLevel(level) ?? `info`, message,
            legacyFeedUrl != null && message === `Switching Sparkle to the fallback feed.`
              ? { safe: { updateFeed: `legacy` }, sensitive: {} }
              : undefined,
          );
        });
      }
      if (typeof sparkle.setInstallUpdatesRequestedSink == `function`) {
        sparkle.setInstallUpdatesRequestedSink(() => {
          this.options.onInstallUpdatesRequested?.({ quitImmediately: false });
        });
      }
      sparkle.setUpdateCheckResultSink((result) => {
        const callback = updateCheckResultCallback;
        updateCheckResultCallback = null;
        callback?.(result);
      });
      if (typeof sparkle.setDownloadProgressSink == `function`) {
        sparkle.setDownloadProgressSink((percent) => {
          this.setDownloadProgressPercent(percent);
        });
      }
      if (typeof sparkle.setUpdateReadySink == `function`) {
        sparkle.setUpdateReadySink((isReady) => {
          this.setUpdateReady(isReady);
        });
      }
      if (typeof sparkle.setUpdateDownloadedSink == `function`) {
        sparkle.setUpdateDownloadedSink((isReady, appName) => {
          this.setUpdateDownloaded(isReady, appName);
        });
      }
      if (hasLifecycleStateSink) {
        setUpdateLifecycleStateSink?.((state) => {
          if (state === `install-aborted`) {
            this.options.onInstallUpdatesAborted?.();
            return;
          }
          this.setUpdateLifecycleState(state as UpdateLifecycleState);
        });
      }
      sparkle.setAutomaticBackgroundDownloadsEnabled(this.automaticBackgroundDownloadsEnabled);
      if (usesProductionAppcast || requestHeaders === false || requestHeaders === undefined) {
        sparkle.init(feedUrl);
      } else if (legacyFeedUrl) {
        sparkle.init(feedUrl, requestHeaders, legacyFeedUrl);
      } else {
        sparkle.init(feedUrl, requestHeaders);
      }
      if (BuildFlavor.isInternal(this.options.buildFlavor)) {
        this.logger.info(`Sparkle update feed selected`, {
          safe: { updateFeed: legacyFeedUrl == null ? `legacy` : `restricted` },
          sensitive: {},
        });
      }
      this.lastUnavailableReason = null;
    } catch (error) {
      this.logger.error(`Failed to initialize Sparkle addon`, {
        safe: {},
        sensitive: { error },
      });
      this.lastUnavailableReason = `failed to initialize sparkle addon`;
      return;
    }

    if (usesProductionAppcast) this.productionSparkle = sparkle;

    // 内部 CDN 头续期（cookie 可能过期）。
    const refreshInternalCdnHeaders = async () => {
      if (legacyFeedUrl == null) return;
      const headers = await this.getInternalUpdateCdnRequestHeaders(feedUrl);
      if (headers && !isEqual(requestHeaders, headers)) {
        sparkle!.setCookieHeader(headers.Cookie);
        requestHeaders = headers;
      }
    };

    const checkForUpdatesInBackground = async (refreshHeaders = true) => {
      try {
        if (refreshHeaders && legacyFeedUrl != null) await refreshInternalCdnHeaders();
        if (
          hasLifecycleStateSink &&
          !this.isUpdateReady &&
          this.updateLifecycleState === `idle`
        ) {
          this.setUpdateLifecycleState(`checking`);
        }
        sparkle!.checkForUpdatesInBackground();
      } catch (error) {
        if (!this.isUpdateReady) this.setUpdateLifecycleState(`idle`);
        this.logger.error(`Failed to check for updates in background`, {
          safe: {},
          sensitive: { error },
        });
      }
    };

    this.setAutomaticBackgroundDownloadsEnabledForMac = (enabled) => {
      sparkle!.setAutomaticBackgroundDownloadsEnabled(enabled);
      if (enabled && !usesProductionAppcast) void checkForUpdatesInBackground();
    };

    this.updater = {
      checkForUpdateInformation: async () => {
        if (legacyFeedUrl != null) await refreshInternalCdnHeaders();
        return new Promise((resolve, reject) => {
          updateCheckResultCallback = resolve;
          try {
            sparkle!.checkForUpdateInformation();
          } catch (error) {
            updateCheckResultCallback = null;
            reject(new Error(`Sparkle could not start the update check.`, { cause: error }));
          }
        }) as Promise<UpdateInformationCheckResult>;
      },
      checkForUpdates: async () => {
        if (legacyFeedUrl != null) await refreshInternalCdnHeaders();
        if (
          hasLifecycleStateSink &&
          !this.isUpdateReady &&
          this.updateLifecycleState === `idle`
        ) {
          this.setUpdateLifecycleState(`checking`);
        }
        sparkle!.checkForUpdates();
      },
      installUpdatesIfAvailable: async () => {
        // 更新已就绪且 execPath 被替换过：先 relaunch（旧进程映像无法安装）。
        if (this.isUpdateReady && this.relaunchStaleMacExecutableIfNeeded()) return;
        if (legacyFeedUrl != null) await refreshInternalCdnHeaders();
        if (typeof sparkle!.installLatestUpdate == `function`) {
          if (this.isUpdateReady) {
            this.logBackendAppcastUpdateEvent({
              action: `install_started`,
              checkType: null,
              result: null,
              targetBuildNumber: null,
            });
            this.options.onInstallUpdatesRequested?.({ quitImmediately: false });
          }
          sparkle!.installLatestUpdate();
          return;
        }
        if (this.isUpdateReady) {
          this.logBackendAppcastUpdateEvent({
            action: `install_started`,
            checkType: null,
            result: null,
            targetBuildNumber: null,
          });
          this.options.onInstallUpdatesRequested?.();
        }
        sparkle!.installUpdatesIfAvailable();
      },
    };

    // production appcast 模式由后端驱动检查；否则按间隔自查 + 立即首查。
    if (!usesProductionAppcast) {
      const intervalMs = updateIntervalMinutes();
      if (intervalMs > 0) {
        const timer = setInterval(() => void checkForUpdatesInBackground(), intervalMs);
        timer.unref();
      }
      void checkForUpdatesInBackground(false);
    }
  }

  /** 打包的 Sparkle feed URL（package.json `codexSparkleFeedUrl`）。 */
  private resolveMacSparkleFeedUrl(): string | null {
    const url = readPackageMetadataField(`codexSparkleFeedUrl`)?.trim() ?? ``;
    if (url) return url;
    this.lastUnavailableReason = `missing packaged sparkle feed url`;
    return null;
  }

  /** 内部更新 CDN feed URL（须为 https，否则告警忽略）。 */
  private resolveMacSparkleInternalCdnFeedUrl(): string | null {
    const url = readPackageMetadataField(`codexSparkleInternalCdnFeedUrl`)?.trim() ?? ``;
    if (!url) return null;
    try {
      if (new URL(url).protocol === `https:`) return url;
    } catch {}
    this.logger.warning(`Ignoring invalid internal update CDN feed URL`);
    return null;
  }

  /** 为内部 CDN feed 取请求头；返回 `false` 表示不可用/未授权。 */
  private async getInternalUpdateCdnRequestHeaders(
    feedUrl: string,
  ): Promise<InternalUpdateCdnRequestHeaders | false> {
    if (!this.options.getInternalUpdateCdnRequestHeaders) {
      this.lastUnavailableReason = `sparkle update access is unavailable`;
      return false;
    }
    let headers: InternalUpdateCdnRequestHeaders | null | undefined;
    try {
      headers = await this.options.getInternalUpdateCdnRequestHeaders(feedUrl);
    } catch (error) {
      this.logger.error(`Failed to authorize Sparkle update access`, {
        safe: {},
        sensitive: { error },
      });
      this.lastUnavailableReason = `sparkle update access is unavailable`;
      return false;
    }
    if (!headers) {
      this.lastUnavailableReason = `sparkle update access was not authorized`;
      return false;
    }
    return headers;
  }

  /** 打包的 Windows 更新 URL（package.json `codexWindowsUpdateUrl`，须 https）。 */
  private resolveWindowsUpdateUrl(): string | null {
    const url = readPackageMetadataField(`codexWindowsUpdateUrl`)?.trim() ?? ``;
    if (!url) {
      this.lastUnavailableReason = `missing packaged windows update url`;
      return null;
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      this.lastUnavailableReason = `invalid packaged windows update url`;
      return null;
    }
    if (parsed.protocol !== `https:`) {
      this.lastUnavailableReason = `windows update url must use https transport`;
      return null;
    }
    return parsed.toString();
  }

  /** MSIX build 版本（package.json `codexBuildNumber`，回退 app 版本）。 */
  private resolveBuildVersion(): string {
    return readPackageMetadataField(`codexBuildNumber`)?.trim() ?? app.getVersion();
  }

  /** Store build 版本（用 shared chunk 的规范化把 app 版本转四段式）。 */
  private resolveWindowsStoreBuildVersion(): string {
    const appVersion = app.getVersion().trim();
    try {
      return normalizeWindowsStoreBuildVersion(appVersion);
    } catch (error) {
      this.logger.warning(
        `Failed to normalize Windows Store build version from app version; using raw app version.`,
        { safe: { appVersion }, sensitive: { error } },
      );
      return appVersion;
    }
  }

  // ---- 状态机推进 ----------------------------------------------------------

  private setUpdateReady(isReady: boolean): void {
    if (isReady) {
      this.setUpdateLifecycleState(`ready`);
    } else if (
      this.updateLifecycleState === `ready` ||
      this.updateLifecycleState === `installing`
    ) {
      this.setUpdateLifecycleState(`idle`);
    }

    if (this.isUpdateReady === isReady) return;
    this.isUpdateReady = isReady;
    if (isReady) {
      if (process.platform === `darwin`) {
        this.logBackendAppcastUpdateEvent({
          action: `check_completed`,
          checkType: null,
          result: `update_available`,
          targetBuildNumber: null,
        });
      } else {
        this.setUpdateDownloaded(true);
      }
    } else {
      this.setUpdateDownloaded(false);
      this.applyPendingSparkleQueryParams();
    }
    this.scheduleForcedUpdateInstall();
    this.options.onUpdateReadyChanged?.(isReady);
  }

  private setUpdateDownloaded(isDownloaded: boolean, appName: string | null = null): void {
    const brand = isDownloaded ? parseDownloadedUpdateAppBrand(appName) : null;
    if (this.downloadedUpdateAppBrand !== brand) {
      this.downloadedUpdateAppBrand = brand;
      this.options.onDownloadedUpdateAppBrandChanged?.(brand);
    }

    if (isDownloaded) {
      if (this.updateDownloadedAtMs != null) return;
      this.updateDownloadedAtMs = Date.now();
      this.logBackendAppcastUpdateEvent({
        action: `download_completed`,
        checkType: null,
        result: `succeeded`,
        targetBuildNumber: null,
      });
    } else {
      if (this.updateDownloadedAtMs == null) return;
      this.updateDownloadedAtMs = null;
      this.forcedUpdateInstallStarted = false;
      this.forcedUpdateRetryAtMs = null;
      this.applyPendingSparkleQueryParams();
    }
    this.scheduleForcedUpdateInstall();
  }

  // ---- Owl 托管 relaunch 策略 ----------------------------------------------

  private observeRelaunchNotificationPolicy(): void {
    this.owlUpdatePolicies = getOwlUpdatePolicies();
    if (!this.owlUpdatePolicies) return;
    this.owlUpdatePolicies.on(`relaunch-notification-policy-changed`, () => {
      this.scheduleForcedUpdateInstall();
    });
    this.scheduleForcedUpdateInstall();
  }

  private scheduleForcedUpdateInstall(): void {
    if (this.forcedUpdateTimer) {
      clearTimeout(this.forcedUpdateTimer);
      this.forcedUpdateTimer = null;
    }

    const policy = this.getRelaunchNotificationPolicy();
    if (
      !this.isUpdateReady ||
      this.updateDownloadedAtMs == null ||
      policy?.relaunchNotification !== 2 ||
      this.forcedUpdateInstallStarted
    ) {
      this.setRelaunchNotice(null);
      return;
    }

    const deadlineAtMs = computeRelaunchDeadline(this.updateDownloadedAtMs, policy);
    // 截止时间向上对齐到 3 分钟粒度（保证 relaunch 窗口不落在边界内）。
    const alignedDeadline =
      this.updateDownloadedAtMs +
      Math.ceil(Math.max(0, deadlineAtMs - this.updateDownloadedAtMs) / RELAUNCH_DEADLINE_ALIGNMENT_MS);
    // 通知提前 24 小时以上才可关闭；对齐后立即到期的则先不出通知。
    this.setRelaunchNotice(Date.now() < alignedDeadline ? null : deadlineAtMs);
    this.scheduleForcedUpdateInstallAt(
      Math.max(deadlineAtMs, this.forcedUpdateRetryAtMs ?? deadlineAtMs),
      deadlineAtMs,
      alignedDeadline,
    );
  }

  /** 强制安装计时器：分片等待（每片 ≤ 24h 减提前量），到期触发 `installForcedUpdate`。 */
  private scheduleForcedUpdateInstallAt(
    installAtMs: number,
    deadlineAtMs: number,
    noticeThresholdMs: number,
  ): void {
    const now = Date.now();
    // 通知窗口结束前用较高的提醒节奏；deadline 前 24h 起加密等待。
    const noticeGraceStartMs = deadlineAtMs - RELAUNCH_NOTICE_DISMISSABLE_LEAD_MS;
    const waitMs =
      (now < noticeThresholdMs
        ? Math.min(installAtMs, noticeThresholdMs)
        : now < noticeGraceStartMs
          ? Math.min(installAtMs, noticeGraceStartMs)
          : installAtMs) - now;
    const timerDelay = Math.min(Math.max(0, waitMs), MAX_TIMER_DELAY_MS);

    this.forcedUpdateTimer = setTimeout(() => {
      this.forcedUpdateTimer = null;
      const now = Date.now();
      if (now < installAtMs) {
        this.setRelaunchNotice(now < noticeThresholdMs ? null : deadlineAtMs);
        this.scheduleForcedUpdateInstallAt(installAtMs, deadlineAtMs, noticeThresholdMs);
        return;
      }
      void this.installForcedUpdate();
    }, timerDelay);
    this.forcedUpdateTimer.unref();
  }

  private getRelaunchNotificationPolicy(): RelaunchNotificationPolicy | null {
    return this.owlUpdatePolicies
      ? getRelaunchNotificationPolicyFrom(this.owlUpdatePolicies)
      : null;
  }

  private async installForcedUpdate(): Promise<void> {
    if (this.forcedUpdateInstallStarted || !this.isUpdateReady) return;
    this.forcedUpdateInstallStarted = true;
    this.setRelaunchNotice(null);
    this.logger.info(`Installing update required by managed relaunch policy.`);
    const installed = await this.installUpdatesIfAvailable();
    if (!installed && this.isUpdateReady) {
      // 安装失败：1 分钟后重试。
      this.forcedUpdateInstallStarted = false;
      this.forcedUpdateRetryAtMs = Date.now() + FORCED_UPDATE_RETRY_INTERVAL_MS;
      this.scheduleForcedUpdateInstall();
    }
  }

  // ---- 进度 / 通知 ---------------------------------------------------------

  private setInstallProgressPercent(percent: number | null): void {
    if (percent == null) {
      if (this.updateLifecycleState === `installing`) {
        this.setUpdateLifecycleState(this.isUpdateReady ? `ready` : `idle`);
      }
    } else {
      this.setUpdateLifecycleState(`installing`);
    }
    if (this.installProgressPercent !== percent) {
      this.installProgressPercent = percent;
      this.options.onInstallProgressChanged?.(percent);
    }
  }

  private setDownloadProgressPercent(percent: number | null): void {
    if (this.downloadProgressPercent === percent) return;
    this.downloadProgressPercent = percent;
    this.options.onDownloadProgressChanged?.(percent);
  }

  private createRelaunchNotice(deadlineAtMs: number): RelaunchNotice {
    const now = Date.now();
    return {
      deadlineAtMs,
      dismissable: deadlineAtMs - now > RELAUNCH_NOTICE_DISMISSABLE_LEAD_MS,
      reportedAtMs: now,
    };
  }

  private setRelaunchNotice(deadlineAtMs: number | null): void {
    if (deadlineAtMs == null) {
      if (this.relaunchNotice == null) return;
      this.relaunchNotice = null;
      this.options.onRelaunchNoticeChanged?.(null);
      return;
    }
    const notice = this.createRelaunchNotice(deadlineAtMs);
    if (
      this.relaunchNotice?.deadlineAtMs !== notice.deadlineAtMs ||
      this.relaunchNotice.dismissable !== notice.dismissable
    ) {
      this.relaunchNotice = notice;
      this.options.onRelaunchNoticeChanged?.(notice);
    }
  }

  private setUpdateLifecycleState(state: UpdateLifecycleState): void {
    if (this.updateLifecycleState === state) return;
    this.updateLifecycleState = state;
    if (state === `ready` && process.platform !== `darwin`) {
      this.setUpdateDownloaded(true);
    } else if (state === `idle` && !this.isUpdateReady) {
      this.setUpdateDownloaded(false);
    }
    this.applyPendingSparkleQueryParams();
    this.options.onUpdateLifecycleStateChanged?.(state);
  }

  private applyPendingSparkleQueryParams(): void {
    if (
      this.pendingSparkleQueryParams != null &&
      this.canReconfigureProductionAppcast()
    ) {
      this.applySparkleQueryParams();
    }
  }

  // ---- macOS 可执行文件身份 --------------------------------------------------

  /** 读当前 execPath 的 dev/ino 身份（可注入，默认 statSync）。 */
  private readMacExecutableIdentity(): MacExecutableIdentity | null {
    if (this.options.getMacExecutableIdentity) return this.options.getMacExecutableIdentity();
    try {
      const stats = statSync(process.execPath, { throwIfNoEntry: false });
      return stats?.isFile() ? { dev: stats.dev, ino: stats.ino } : null;
    } catch (error) {
      this.logger.warning(`Failed to read macOS app executable identity`, {
        safe: {},
        sensitive: { error },
      });
      return null;
    }
  }

  /**
   * Sparkle 已下载新版本时会替换 app bundle；若 execPath 的 dev/ino 与启动时不一致，
   * 先 `app.relaunch()` 让新映像接管安装。返回是否触发了 relaunch。
   */
  private relaunchStaleMacExecutableIfNeeded(): boolean {
    const launchIdentity = this.macExecutableIdentityAtLaunch;
    if (launchIdentity == null) return false;
    const currentIdentity = this.readMacExecutableIdentity();
    if (currentIdentity == null || (currentIdentity.dev === launchIdentity.dev && currentIdentity.ino === launchIdentity.ino)) {
      return false;
    }
    this.logger.warning(
      `Relaunching before macOS update install because the app executable changed on disk.`,
      { safe: { currentIdentity, launchIdentity }, sensitive: {} },
    );
    app.relaunch({ execPath: process.execPath });
    if (this.options.onInstallUpdatesRequested) {
      this.options.onInstallUpdatesRequested({ quitImmediately: true });
    } else {
      app.quit();
    }
    return true;
  }

  // ---- 遥测 / 杂项 ------------------------------------------------------------

  /** production appcast 更新事件日志（仅 prod 构建记录）。 */
  private logBackendAppcastUpdateEvent(event: {
    action: string;
    checkType: string | null;
    result: string | null;
    targetBuildNumber: string | null;
  }): void {
    if (this.options.buildFlavor !== BuildFlavor.Prod) return;
    this.logger.info(`Production Sparkle update event`, {
      safe: {
        ...event,
        backendAppcastEnabled: this.productionSparkle != null,
        currentBuildNumber: readPackageMetadataField(`codexBuildNumber`)?.trim() ?? null,
      },
      sensitive: {},
    });
  }

  /** 原生 Sparkle 日志级别（1..5）→ logger 级别；未知返回 null（调用侧按 info 记录）。 */
  private decodeNativeLogLevel(level: number): LogLevel | null {
    switch (level) {
      case 1:
        return `trace`;
      case 2:
        return `debug`;
      case 3:
        return `info`;
      case 4:
        return `warning`;
      case 5:
        return `error`;
      default:
        return null;
    }
  }
}
