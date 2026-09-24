// Desktop runtime 装配根（composition root，bootstrap 23201-23361 行重写）。
//
// createDesktopRuntime（原始 jO）是惰性单例：首次调用时创建 NetworkPolicy、
// startup config 客户端、Sentry/OTel/Datadog 初始化、文件日志安装、协议注册、
// appcast store、SparkleManager，并把结果缓存在 runtimeSingleton（原始 AO），
// 重复调用直接返回同一实例。
//
// setSparkleBridgeHandlers / setSecondInstanceArgsHandler 是 main chunk
// （main-C-Mhak1n.js）反向注入回调的口子：runtime 必须先创建（引导主流程在
// requestSingleInstanceLock 之后立即调用），回调随后才注入；second-instance
// 的 argv 在 handler 注入前先进队列。
import { join } from "node:path";
import { app } from "electron";
import { getLogger } from "@chunk/logger";
import {
  ft as DatadogLogger,
  o as StartupConfigClient,
  pt as DatadogTransport,
} from "@chunk/shared";
import { BuildFlavor, bundleIdentifier } from "./build-info/build-flavor";
import { BuildNumber } from "./build-info/build-number";
import { readPackageMetadataField } from "./metadata/package-metadata";
import { NetworkPolicy, appSessionId } from "./net/network-policy";
import {
  registerPrivilegedAppSchemes,
  getDevRendererOrigin,
} from "./protocol/app-protocol";
import { StartupChanges } from "./startup/startup-changes";
import { StartupPhases } from "./startup/startup-phases";
import { createErrorReporter, type ErrorReportContext, type ErrorReporter, type ErrorReportSink } from "./telemetry/error-reporter";
import {
  SENTRY_STARTUP_CONFIG,
  desktopSentry,
  initDesktopSentry,
} from "./telemetry/desktop-sentry";
import {
  bindWebsiteReporting,
  setupDesktopTracing,
} from "./telemetry/otel-tracing";
import { installDesktopFileLogger } from "./logging/file-logger";
import { defaultMaxLogLevelForFlavor } from "./logging/log-level";
import type { LogLevel } from "@chunk/logger";
import { ProductionAppcastState } from "./updater/production-appcast-state";
import { SparkleManager } from "./updater/sparkle-manager";

/** Sparkle 更新事件回调集合（main chunk 通过 setSparkleBridgeHandlers 注入）。 */
export interface SparkleBridgeHandlers {
  onInstallUpdatesRequested?: (update: unknown) => void;
  onInstallUpdatesAborted?: () => void;
  onUpdateLifecycleStateChanged?: (state: unknown) => void;
  onRelaunchNoticeChanged?: (notice: unknown) => void;
  onUpdateReadyChanged?: (ready: unknown) => void;
  onInstallProgressChanged?: (progress: unknown) => void;
  onDownloadProgressChanged?: (progress: unknown) => void;
  onDownloadedUpdateAppBrandChanged?: (brand: unknown) => void;
  isTrustedIpcEvent?: (event: unknown) => boolean;
}

/** createDesktopRuntime 的装配结果（原始 jO 返回值字面量）。 */
export interface DesktopRuntime {
  applicationNetwork: NetworkPolicy;
  startedAtMs: number;
  buildFlavor: string;
  desktopSentry: typeof desktopSentry;
  errorReporter: ErrorReporter;
  datadogLogger: unknown;
  maxLogLevel: LogLevel | undefined;
  startupConfig: InstanceType<typeof StartupConfigClient>;
  startupPolicies: StartupChanges;
  sparkleManager: SparkleManager;
  startupPhases: StartupPhases;
  productionAppcastStateStore: ProductionAppcastState | null;
  /** main chunk 注入 Sparkle 事件回调（只覆盖传入的字段）。 */
  setSparkleBridgeHandlers(handlers: SparkleBridgeHandlers): void;
  /** main chunk 注入 second-instance argv 处理器，注入前积压的 argv 会立刻回放。 */
  setSecondInstanceArgsHandler(handler: (args: string[]) => void): void;
  /** 引导主流程在 second-instance 事件里调用；handler 未注入时入队等待。 */
  queueSecondInstanceArgs(args: string[]): void;
}

/** jO() 的惰性单例缓存（原始 AO）。重复调用 createDesktopRuntime 返回同一实例。 */
export let runtimeSingleton: DesktopRuntime | null = null;

/**
 * 装配 desktop runtime（原始 jO）。
 *
 * 首次调用产生全部副作用（Sentry/OTel/Datadog 初始化、文件日志安装、
 * registerSchemesAsPrivileged、SparkleManager 构造），之后缓存为单例。
 * 必须在 app.setName/setPath('userData') 之后调用（内部会读 userData/appData）。
 */
export function createDesktopRuntime(buildFlavorOverride?: string): DesktopRuntime {
  if (runtimeSingleton) return runtimeSingleton;
  const startedAtMs = Date.now();
  if (process.env.CODEX_DESKTOP_NETWORK_POLICY != null)
    throw Error(
      `Restricted Desktop networking is not available in this runtime. Use app-server application requirements instead of CODEX_DESKTOP_NETWORK_POLICY.`,
    );
  const applicationNetwork = new NetworkPolicy(getDevRendererOrigin());
  applicationNetwork.observeSessions();
  const startupConfig = new StartupConfigClient();
  const startupPolicies = new StartupChanges();
  const isAnalyticsEnabled = (config: { analytics?: { enabled?: boolean } }) =>
    config.analytics?.enabled !== false;
  const analyticsEnabled = startupConfig.get().then(isAnalyticsEnabled);
  startupPolicies.register(
    analyticsEnabled.catch(() => false),
    isAnalyticsEnabled,
  );
  bindWebsiteReporting(analyticsEnabled);
  analyticsEnabled
    .then(
      (enabled) => initDesktopSentry(enabled, applicationNetwork),
      () => initDesktopSentry(false, applicationNetwork),
    )
    .catch((error) => {
      getLogger().warning(`Failed to initialize desktop error reporting`, {
        safe: {},
        sensitive: { error },
      });
    });
  setupDesktopTracing(SENTRY_STARTUP_CONFIG, `electron-main`);
  const buildFlavor = buildFlavorOverride ?? BuildFlavor.resolve();
  const maxLogLevel = defaultMaxLogLevelForFlavor(buildFlavor);
  const errorReporterSink: ErrorReportSink = (error, severity, context: ErrorReportContext | undefined) => {
    desktopSentry.captureException(error, {
      fingerprint: context?.groupingFingerprint,
      level: severity === `fatal` ? `fatal` : `error`,
      tags: context?.tags,
      extra: context?.extra,
    });
  };
  const errorReporter = createErrorReporter(errorReporterSink);
  const reportDatadogSinkFailure = (failure: { type: unknown; reason: unknown }) => {
    errorReporter.reportNonFatal(`Datadog log sink failure`, {
      kind: `datadog-log-sink-failure`,
      tags: { failureType: failure.type, reason: failure.reason },
      extra: { failure },
    });
  };
  const datadogTransport = new DatadogTransport({
    analyticsEnabled,
    waitUntilReady: () => applicationNetwork.whenReady(),
    fetchImpl: (url: string, init: unknown) => applicationNetwork.fetch(url, init),
    reportFailure: reportDatadogSinkFailure,
  });
  app.once(`quit`, () => {
    datadogTransport.dispose();
    applicationNetwork.dispose();
  });
  const datadogLogger = new DatadogLogger({
    source: `codex-desktop`,
    env: buildFlavor,
    codexAppSessionId: appSessionId,
    platform: process.platform,
    buildInfo: { version: app.getVersion(), buildNumber: BuildNumber.value },
    reportFailure: reportDatadogSinkFailure,
    transport: datadogTransport,
  });
  installDesktopFileLogger(errorReporter, datadogLogger, appSessionId, maxLogLevel);
  registerPrivilegedAppSchemes();
  // ---- Sparkle 事件回调（默认 no-op；安装请求的默认行为是退出应用以便更新，main
  // chunk 通过 setSparkleBridgeHandlers 覆盖）----
  const quitForUpdate = () => {
    if (process.platform === `win32` && app.isPackaged) {
      app.exit(0);
      return;
    }
    app.quit();
  };
  let onInstallUpdatesRequested: (update: unknown) => void = quitForUpdate;
  let onUpdateLifecycleStateChanged: (state: unknown) => void = () => {};
  let onInstallUpdatesAborted: () => void = () => {};
  let onRelaunchNoticeChanged: (notice: unknown) => void = () => {};
  let onUpdateReadyChanged: (ready: unknown) => void = () => {};
  let onInstallProgressChanged: (progress: unknown) => void = () => {};
  let onDownloadProgressChanged: (progress: unknown) => void = () => {};
  let onDownloadedUpdateAppBrandChanged: (brand: unknown) => void = () => {};
  let isTrustedIpcEvent: (event: unknown) => boolean = () => false;
  // ---- second-instance argv 队列（handler 注入前先积压）----
  let queuedSecondInstanceArgs: string[][] = [];
  let secondInstanceArgsHandler: ((args: string[]) => void) | null = null;
  const productionAppcastStateStore =
    buildFlavor === BuildFlavor.Prod &&
    process.platform === `darwin` &&
    readPackageMetadataField(`codexReleaseChannel`) !== `prod-internal`
      ? new ProductionAppcastState(join(app.getPath(`appData`), bundleIdentifier(buildFlavor)))
      : null;
  runtimeSingleton = {
    applicationNetwork,
    startedAtMs,
    buildFlavor,
    desktopSentry,
    errorReporter,
    datadogLogger,
    maxLogLevel,
    startupConfig,
    startupPolicies,
    sparkleManager: new SparkleManager({
      enableUpdater: BuildFlavor.shouldIncludeUpdater(buildFlavor, process.platform, process.env),
      buildFlavor,
      isPackaged: app.isPackaged,
      useInternalUpdateCdn: false,
      getInternalUpdateCdnRequestHeaders: void 0,
      productionAppcastStateStore: productionAppcastStateStore?.backendAppcastEnabled
        ? productionAppcastStateStore
        : void 0,
      onUpdateReadyChanged: (ready) => {
        onUpdateReadyChanged(ready);
      },
      onInstallUpdatesRequested: (update) => {
        onInstallUpdatesRequested(update);
      },
      onInstallUpdatesAborted: () => {
        onInstallUpdatesAborted();
      },
      onInstallProgressChanged: (progress) => {
        onInstallProgressChanged(progress);
      },
      onDownloadProgressChanged: (progress) => {
        onDownloadProgressChanged(progress);
      },
      onDownloadedUpdateAppBrandChanged: (brand) => {
        onDownloadedUpdateAppBrandChanged(brand);
      },
      onUpdateLifecycleStateChanged: (state) => {
        onUpdateLifecycleStateChanged(state);
      },
      onRelaunchNoticeChanged: (notice) => {
        onRelaunchNoticeChanged(notice);
      },
      isTrustedIpcEvent: (event) => isTrustedIpcEvent(event),
    }),
    startupPhases: new StartupPhases(),
    productionAppcastStateStore,
    setSparkleBridgeHandlers: (handlers) => {
      handlers.onInstallUpdatesRequested != null && (onInstallUpdatesRequested = handlers.onInstallUpdatesRequested);
      handlers.onInstallUpdatesAborted != null && (onInstallUpdatesAborted = handlers.onInstallUpdatesAborted);
      handlers.onUpdateLifecycleStateChanged != null && (onUpdateLifecycleStateChanged = handlers.onUpdateLifecycleStateChanged);
      handlers.onRelaunchNoticeChanged != null && (onRelaunchNoticeChanged = handlers.onRelaunchNoticeChanged);
      handlers.onUpdateReadyChanged != null && (onUpdateReadyChanged = handlers.onUpdateReadyChanged);
      handlers.onInstallProgressChanged != null && (onInstallProgressChanged = handlers.onInstallProgressChanged);
      handlers.onDownloadProgressChanged != null && (onDownloadProgressChanged = handlers.onDownloadProgressChanged);
      handlers.onDownloadedUpdateAppBrandChanged != null && (onDownloadedUpdateAppBrandChanged = handlers.onDownloadedUpdateAppBrandChanged);
      handlers.isTrustedIpcEvent != null && (isTrustedIpcEvent = handlers.isTrustedIpcEvent);
    },
    setSecondInstanceArgsHandler: (handler) => {
      secondInstanceArgsHandler = handler;
      for (const args of queuedSecondInstanceArgs) handler(args);
      queuedSecondInstanceArgs = [];
    },
    queueSecondInstanceArgs: (args) => {
      if (secondInstanceArgsHandler != null) {
        secondInstanceArgsHandler(args);
        return;
      }
      queuedSecondInstanceArgs.push(args);
    },
  };
  return runtimeSingleton;
}
