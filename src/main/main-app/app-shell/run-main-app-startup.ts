// runMainAppStartup（Ust）—— 主进程启动序列总装配。
//
// 对应 main-C-Mhakn.ts 的 175,822-176,953 行区段（~1,130 行）：
//   - 启动上下文解构：startedAtMs / applicationNetwork / buildFlavor /
//     desktopSentry / errorReporter / datadogLogger / maxLogLevel /
//     startupConfig / startupPolicies / sparkleManager / startupPhases /
//     productionAppcastStateStore / setSparkleBridgeHandlers /
//     setSecondInstanceArgsHandler
//   - 形态判定：shouldIncludeSparkle / shouldIncludeUpdater / allowDevtools /
//     Dev|Agent 判定 / allowDebugMenu / darwin|win32
//   - 阶段计时（startup logger trace：phaseElapsedMs / startupElapsedMs）
//   - 依次装配（关键阶段名直证据）：bootstrap handoff complete →
//     app-server 传输 → WindowManager（Qot）→ windowServices 工厂（dst）→
//     worker 宿主群 + worker-bus（xst）→ 托盘子系统 → 应用菜单（sit）→
//     deep link 路由 → 退出守卫 → 关于对话框 → hotkey window 控制器 →
//     全局听写 → Ust 完成
//   - Wst 更新即时退出清理（176,954-176,977）
//
// 消费者：bootstrap chunk 的 app.whenReady。

import { createTaggedLogger } from "@chunk/logger";

const startupLogger = createTaggedLogger("startup");

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 构建形态。 */
export type BuildFlavor = "Dev" | "Agent" | "Prod" | "Nightly";

/** 启动上下文（a.x() 的结构化子集）。 */
export interface MainStartupContext {
  buildFlavor: BuildFlavor;
  datadogLogger: unknown;
  desktopSentry: unknown;
  errorReporter: { reportNonFatal(error: Error, context: { kind: string }): void };
  maxLogLevel: string;
  productionAppcastStateStore: unknown;
  setSecondInstanceArgsHandler(handler: () => void): void;
  setSparkleBridgeHandlers(handlers: unknown): void;
  sparkleManager: unknown;
  startedAtMs: number;
  startupConfig: { get(): Promise<unknown> };
  startupPhases: unknown;
  startupPolicies: unknown;
}

/** 形态判定结果。 */
export interface StartupFlavorFlags {
  allowDebugMenu: boolean;
  allowDevtools: boolean;
  isDarwin: boolean;
  isDevOrAgent: boolean;
  isWin32: boolean;
  shouldIncludeSparkle: boolean;
  shouldIncludeUpdater: boolean;
}

/** 阶段计时器。 */
export interface StartupPhaseTracker {
  mark(phase: string, options?: { background?: boolean }): void;
  phaseElapsedMs: Record<string, number>;
}

// ---------------------------------------------------------------------------
// 阶段计时（原 Ust 内的 M 闭包）
// ---------------------------------------------------------------------------

/** 计时器创建（原 `M` 闭包：startup trace + phaseElapsed 累计）。 */
export function createStartupPhaseTracker(startedAtMs: number): StartupPhaseTracker {
  const phaseElapsedMs: Record<string, number> = {};
  return {
    mark(phase, options = {}) {
      const atMs = Date.now();
      if (options.background !== true) phaseElapsedMs[phase] = atMs - startedAtMs;
      startupLogger.trace(phase, { safe: { phaseElapsedMs: atMs - startedAtMs, startupElapsedMs: atMs - startedAtMs } });
    },
    phaseElapsedMs,
  };
}

// ---------------------------------------------------------------------------
// 启动序列（原 `Ust`）
// ---------------------------------------------------------------------------

/**
 * runMainAppStartup（原 `Ust`）：
 * 形态判定 → 逐阶段装配（app-server / WindowManager / windowServices /
 * worker 宿主 / 托盘 / 菜单 / deep link / 退出守卫 / hotkey / 听写）。
 * 各阶段的具体装配体在 window/ 与各子系统模块落地后接入。
 */
export async function runMainAppStartup(context: MainStartupContext): Promise<void> {
  const tracker = createStartupPhaseTracker(context.startedAtMs);
  const flags: StartupFlavorFlags = {
    allowDebugMenu: context.buildFlavor === "Dev" || context.buildFlavor === "Agent" || context.buildFlavor === "Nightly",
    allowDevtools: context.buildFlavor === "Dev",
    isDarwin: process.platform === "darwin",
    isDevOrAgent: context.buildFlavor === "Dev" || context.buildFlavor === "Agent",
    isWin32: process.platform === "win32",
    shouldIncludeSparkle: context.buildFlavor === "Prod" && process.platform === "darwin",
    shouldIncludeUpdater: context.buildFlavor === "Prod",
  };
  tracker.mark("bootstrap handoff complete");
  void flags;
  void context.sparkleManager;
  void context.startupPhases;
  void context.startupPolicies;
  tracker.mark("run-main-app-startup complete");
}

/** 更新即时退出清理（原 `Wst`）。 */
export function cleanupForImmediateQuitOnUpdate(): void {
  startupLogger.info("immediate quit for update", { safe: {} });
}
