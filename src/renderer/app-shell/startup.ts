// 主窗口启动编排：窗口类型 dataset → 遥测/错误接线 → 服务装配 → 首屏预取 →
// StrictMode render。
//
// 对应 app-initial-51da50e6c6e3.js 的 L211,301-211,374（压缩名 → 语义）：
//   - jqc（启动初始化器）：记录入口求值时刻 Cqc；pagehide/visibilitychange
//     清理（遥测 dispose + 消息桥收尾）；documentElement dataset
//     （codexWindowType/windowType/codexOs/codexWindowChrome + compact-window
//     class + hotkey 窗口 body tabIndex=-1）；mcpAppSandboxLocalDevelopment
//     查询参数；全局 error/unhandledrejection → log-message 上报
//   - vqc：Sentry/OTel 初始化（TGi）+ 启动性能计时（V_.start，
//     initialRoute 解析 uVt + preload 计时基准 Aqc）
//   - _qc（总编排）：vqc → xqc（预留）→ 首屏预取（avatar 窗口走
//     Wec.prefetch，主窗口走 srs——authed-route + home-composer-route 两
//     chunk，失败仅告警）→ CGi（AppHost 服务装配，见 rpc 模块）→ p9i →
//     yqc（host_services_ready + OGi/aVt）→ 等待预取 → bqc
//   - bqc（render 请求）：host_startup_ready 等待（oU.startup.whenReady +
//     navigation timing 对接）→ 渲染 lqc
//   - lqc（App 根组件）：StrictMode + 可拖拽工具条占位（主窗口）+ ErrorBoundary
//     fallback + startupReady 悬空 span（renderer_ready 标记 ref uqc）+
//     Suspense(zKc)
//   - uqc：ref 回调 → markInitializationPhase('renderer_ready') + IBc
//
// 窗口形态判定（gqc）：pqc=hotkey 窗口（$h）、mqc=avatar 窗口（eg）、
// hqc=detached（dL === vbe）。
// 入口链：index.html → index chunk → rpc chunk（触发本模块所属的 sU 懒装配）→
// app-main（__codexRoot createRoot + render(_qc())）。

// ---------------------------------------------------------------------------
// 窗口类型与 dataset（原 `jqc` 的文档装配）
// ---------------------------------------------------------------------------

/** 窗口形态。 */
export type WindowKind = "primary" | "hotkey" | "avatar-overlay" | "detached" | "other";

/** 判定窗口形态（原 gqc 的 pqc/mqc/hqc 三标志）。 */
export function detectWindowKind(initialRoute: string, options: { isHotkeyRoute: (route: string) => boolean; isAvatarRoute: (route: string) => boolean; detachedRoute: string }): WindowKind {
  if (options.isHotkeyRoute(initialRoute)) return "hotkey";
  if (options.isAvatarRoute(initialRoute)) return "avatar-overlay";
  if (initialRoute === options.detachedRoute) return "detached";
  return "primary";
}

/**
 * 文档 dataset 装配（原 `jqc` 的 dataset 段）：
 * codexWindowType/windowType/codexOs/codexWindowChrome + compact-window +
 * hotkey 窗口的 body tabIndex。
 */
export function installWindowTypeDataset(windowKind: WindowKind, osName: string, options: { compactWindow: boolean; chromeKind: (type: string, os: string) => string }): void {
  const root = document.documentElement;
  root.dataset.codexWindowType = "electron";
  root.dataset.windowType = "electron";
  root.dataset.codexOs = osName;
  root.dataset.codexWindowChrome = options.chromeKind("electron", osName);
  if (new URL(window.location.href).searchParams.get("mcpAppSandboxLocalDevelopment") === "1") {
    root.dataset.mcpAppSandboxLocalDevelopment = "true";
  }
  if (options.compactWindow) root.classList.add("compact-window");
  if (windowKind === "hotkey") document.body.tabIndex = -1;
}

// ---------------------------------------------------------------------------
// 全局错误接线（原 `jqc` 的 error 段）
// ---------------------------------------------------------------------------

/** log-message 分发面（消息桥装配后可用）。 */
export type LogMessageDispatch = (type: "log-message", payload: { level: string; message: string }) => void;

/** 全局 error / unhandledrejection → log-message 上报。 */
export function installGlobalErrorReporting(dispatch: LogMessageDispatch): void {
  window.addEventListener("error", (event) => {
    const detail = (event as ErrorEvent & { error?: Error })?.error?.stack ?? (event as ErrorEvent & { error?: Error })?.error?.message ?? event.message ?? "Unknown error";
    dispatch("log-message", { level: "error", message: `[desktop-notifications][global-error] ${String(detail)}` });
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason: unknown = (event as PromiseRejectionEvent).reason;
    const detail = typeof reason == "object" && reason ? ((reason as Error).stack ?? (reason as Error).message ?? JSON.stringify(reason)) : String(reason);
    dispatch("log-message", { level: "error", message: `[desktop-notifications][unhandled-rejection] ${detail}` });
  });
}

// ---------------------------------------------------------------------------
// 启动阶段计时（原 `V_` 消费面：markInitializationPhase）
// ---------------------------------------------------------------------------

/** 启动性能计时期（结构化子集）。 */
export interface StartupPerformance {
  markInitializationPhase(phase: string, atMs?: number): void;
  start(initialRoute: string, preloadStartedAtMs: number, isNavigate: boolean, route: string): void;
  setHostStartupTiming(timing: unknown, preloadStartedAtMs: number): void;
  dispose(): void;
}

/** 各阶段（原文核实的字符串）。 */
export const STARTUP_PHASES = {
  rendererEntryEvaluated: "renderer_entry_evaluated",
  rendererReady: "renderer_ready",
  hostServicesReady: "host_services_ready",
  hostStartupReady: "host_startup_ready",
} as const;

// ---------------------------------------------------------------------------
// 启动编排（原 `_qc`/`vqc`/`yqc`/`bqc`）
// ---------------------------------------------------------------------------

/** 启动依赖注入面。 */
export interface StartupDependencies {
  performance: StartupPerformance;
  /** Sentry/OTel 初始化（原 TGi）。 */
  initializeDiagnostics(): void;
  /** AppHost 服务装配（原 CGi，rpc chunk 转发的 initializeAppHostServices）。 */
  initializeAppHostServices(): Promise<void>;
  /** 首屏预取（主窗口：authed-route + home-composer-route；avatar：native page）。 */
  prefetchInitialRoute(): Promise<void> | null;
  /** host_services_ready 阶段附加装配（原 OGi/aVt）。 */
  onHostServicesReady(): void;
  /** renderer_ready 阶段附加装配（原 IBc）。 */
  onRendererReady(): void;
  /** pagehide/visibilitychange 清理（原 RBc/OGi/Aat/rhi/qv/ty dispose）。 */
  onShutdown(): void;
  /** startup.whenReady（宿主启动完成信号；缺省时跳过等待）。 */
  waitForHostStartup(): Promise<unknown> | null;
  /** 渲染根组件（原 lqc）。 */
  renderApp(startupReady: Promise<unknown> | null): unknown;
}

/**
 * 启动编排（原 `_qc`）：
 * vqc（诊断+计时）→ 预取（失败仅告警）→ 服务装配 → host_services_ready →
 * 等待预取 → renderApp。
 */
export async function startMainWindow(deps: StartupDependencies): Promise<unknown> {
  // vqc：诊断 + 入口计时
  deps.initializeDiagnostics();
  const entryEvaluatedAt = performance.timeOrigin + performance.now();
  deps.performance.markInitializationPhase(STARTUP_PHASES.rendererEntryEvaluated, entryEvaluatedAt);
  // pagehide/visibilitychange 清理接线
  window.addEventListener("pagehide", () => {
    deps.onShutdown();
    deps.performance.dispose();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") deps.onShutdown();
  });
  // 预取（不阻塞服务装配；失败仅告警，渲染时会重试）
  const prefetch = deps.prefetchInitialRoute()?.catch((error) => {
    // 原文：Initial route prefetch failed; rendering will retry
    void error;
  });
  // 服务装配
  await deps.initializeAppHostServices();
  // yqc：host_services_ready
  deps.performance.markInitializationPhase(STARTUP_PHASES.hostServicesReady);
  deps.onHostServicesReady();
  // 等待预取完成
  if (prefetch != null) await prefetch;
  // bqc：render 请求 + host_startup_ready 等待
  const startupReady = deps.waitForHostStartup() != null ? Promise.resolve(deps.waitForHostStartup()).then(() => {
    deps.performance.markInitializationPhase(STARTUP_PHASES.hostStartupReady);
  }) : null;
  return deps.renderApp(startupReady);
}
