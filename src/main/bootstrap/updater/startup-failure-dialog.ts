// 启动失败对话框（原 bootstrap-C4dRql4x.ts 25324-25366 行的 `wj`/`Tj`/`Ej`
// 以及 Owl shell 断言）。
//
// 主流程（main.ts）在动态加载主应用 chunk 失败时的兜底路径：
//   destroy 全部窗口 → Sentry captureException →
//   `sparkleManager.startUpdaterAfterStartupFailure()`（把 in-app updates 策略门
//   无条件放行并初始化更新器）→ `showStartupFailureDialog(error)`（本模块）。
//
// 对话框语义（保持原始分支）：
//   - 更新已就绪（isUpdateReady）→ 按钮 [Install Update, Quit]；
//   - 更新器可用（hasUpdater）   → 按钮 [Check for Updates, Quit]；
//   - 否则                       → 按钮 [Quit]。
//   Install/Check 动作完成后，win32 上会递归重试整个 `showStartupFailureDialog(e)`
//   调用链（更新安装后旧进程通常直接退出；未退出则再次弹窗）。
//
// 注意：`WEBRTC_FIELD_TRIALS`（`wj`）虽在本行区间定义，但它是主流程
// （`o.app.commandLine.appendSwitch('force-fieldtrials', wj)`，必须在 app ready
// 之前生效）使用的常量。按任务约定从本模块导出，集成方后续可能挪到
// startup/command-line 一侧。

import { app, dialog } from "electron";
// desktop-runtime 的 `jO`（惰性单例）。无参调用即取回已组装的 runtime
// （主流程 `let e = jO(Oj)` 已先行创建），语义与原 `jO()` 一致。
import { createDesktopRuntime } from "../desktop-runtime";

/**
 * WebRTC field trials 开关串（原 `wj`）。
 * 主流程在 app ready 前通过 `commandLine.appendSwitch('force-fieldtrials', …)` 生效。
 */
export const WEBRTC_FIELD_TRIALS =
  `WebRTC-Sctp-Snap/Enabled/WebRTC-IceHandshakeDtls/Enabled/WebRTC-ForceDtls13/Enabled/`;

/** 启动失败对话框的动作标识。 */
export type StartupFailureDialogAction = "install-update" | "check-for-updates" | "quit";

/** 按钮文案（原 `Tj`）。 */
export const STARTUP_FAILURE_DIALOG_BUTTON_LABELS: Record<StartupFailureDialogAction, string> = {
  "install-update": `Install Update`,
  "check-for-updates": `Check for Updates`,
  quit: `Quit`,
};

/**
 * 显示启动失败对话框（原 `Ej`）。
 *
 * 根据更新器状态给出 Install Update / Check for Updates / Quit 三选一；
 * 用户选择 Install 或 Check 并执行完成后，win32 上递归重试本对话框，
 * 直到更新器安装（旧进程退出）或用户选择 Quit（`app.quit()` 后返回）。
 */
export async function showStartupFailureDialog(error: unknown): Promise<void> {
  const { sparkleManager } = createDesktopRuntime();

  const actions: StartupFailureDialogAction[] = sparkleManager.getIsUpdateReady()
    ? [`install-update`, `quit`]
    : sparkleManager.hasUpdater()
      ? [`check-for-updates`, `quit`]
      : [`quit`];

  const { response } = await dialog.showMessageBox({
    type: `error`,
    buttons: actions.map((action) => STARTUP_FAILURE_DIALOG_BUTTON_LABELS[action]),
    defaultId: 0,
    cancelId: actions.length - 1,
    message: `${app.getName()} failed to start.`,
    detail:
      error instanceof Error ? error.message : `The main desktop app failed during startup.`,
    noLink: true,
  });

  switch (actions[response] ?? `quit`) {
    case `install-update`:
      await sparkleManager.installUpdatesIfAvailable();
      break;
    case `check-for-updates`:
      await sparkleManager.checkForUpdates();
      break;
    case `quit`:
      app.quit();
      return;
  }

  // win32：安装/检查动作结束后进程若仍存活（例如安装中止），递归重试。
  if (process.platform === `win32`) await showStartupFailureDialog(error);
}

/**
 * Owl app shell 断言（原 25330-25331 行的顶层守卫，模块加载即执行）：
 * Codex 桌面依赖 Owl shell 补丁面（如 `app.showTaskManager`），
 * 原生 Electron 不再受支持。
 *
 * `showTaskManager` 是 Owl shell 对 Electron `App` 的专有扩展（上游类型不含它），
 * 因此这里以 `(app as …)` 探测——运行时语义与原始 `typeof o.app.showTaskManager`
 * 完全一致。
 *
 * 注意：原代码位于 `Ej` 定义之前的模块顶层。本模块被 import 即触发断言，
 * 与原时序（bootstrap 加载期）等价；若集成方希望严格保持原始位置，
 * 也可在 main.ts 引导头部显式调用。
 */
export function assertOwlAppShell(): void {
  if (
    process.versions.electron != null &&
    typeof (app as typeof app & { showTaskManager?: unknown }).showTaskManager != `function`
  ) {
    throw Error(`Codex requires the Owl app shell; stock Electron is no longer supported.`);
  }
}

assertOwlAppShell();
