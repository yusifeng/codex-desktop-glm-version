import { writeFileSync } from "node:fs";

export const DEV_PARENT_PID_ENV = `CODEX_ELECTRON_DEV_PARENT_PID`;
export const DEV_WEBVIEW_PID_ENV = `CODEX_ELECTRON_DEV_WEBVIEW_PID`;
export const DEV_RELAUNCH_MARKER_PATH_ENV = `CODEX_ELECTRON_DEV_RELAUNCH_MARKER_PATH`;

export function parsePositivePid(raw: string | undefined): number | null {
  let value = raw?.trim();
  if (!value) return null;
  let pid = Number(value);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function isMissingProcessError(error: unknown): boolean {
  return typeof error === `object` && error != null && `code` in error && error.code === `ESRCH`;
}

/** 写入 dev relaunch marker；缺路径或写失败均返回 false（原 `Yoe`）。 */
export function requestDevRelaunch({
  markerPath = process.env[DEV_RELAUNCH_MARKER_PATH_ENV]?.trim(),
  writeMarker = (target: string) => writeFileSync(target, `${process.pid}\n`, `utf8`),
}: {
  markerPath?: string;
  writeMarker?: (target: string) => void;
} = {}): boolean {
  if (!markerPath) return false;
  try {
    writeMarker(markerPath);
    return true;
  } catch {
    return false;
  }
}

/** signal 0 探测父进程；除 ESRCH 外的错误按“仍存活”处理（原 `Xoe`）。 */
export function isProcessRunning(
  pid: number,
  killImpl: (pid: number, signal: 0) => void = (target, signal) => process.kill(target, signal),
): boolean {
  try {
    killImpl(pid, 0);
    return true;
  } catch (error) {
    return !isMissingProcessError(error);
  }
}

/** dev 父进程退出时关闭桌面 app，并在 will-quit 清理轮询（原 `Zoe`）。 */
export function installDevParentProcessMonitor({
  app,
  parentPid = parsePositivePid(process.env[DEV_PARENT_PID_ENV]),
  pollIntervalMs = 1000,
  isParentProcessRunning = isProcessRunning,
  setIntervalImpl = setInterval,
  clearIntervalImpl = clearInterval,
}: {
  app: { once(event: string, listener: () => void): unknown; quit(): void };
  parentPid?: number | null;
  pollIntervalMs?: number;
  isParentProcessRunning?: (pid: number) => boolean;
  setIntervalImpl?: typeof setInterval;
  clearIntervalImpl?: typeof clearInterval;
}): () => void {
  if (parentPid == null) return () => {};
  let disposed = false;
  let dispose = () => {
    if (!disposed) {
      disposed = true;
      clearIntervalImpl(timer);
    }
  };
  let timer = setIntervalImpl(() => {
    if (!isParentProcessRunning(parentPid)) {
      dispose();
      app.quit();
    }
  }, pollIntervalMs);
  app.once(`will-quit`, dispose);
  return dispose;
}

/** app 退出时杀掉 dev webview 进程组，失败再退回单 PID（原 `Qoe`）。 */
export function installDevWebviewCleanup({
  app,
  webviewPid = parsePositivePid(process.env[DEV_WEBVIEW_PID_ENV]),
  killImpl = (pid: number, signal: NodeJS.Signals) => process.kill(pid, signal),
}: {
  app: { once(event: string, listener: () => void): unknown; off(event: string, listener: () => void): unknown };
  webviewPid?: number | null;
  killImpl?: (pid: number, signal: NodeJS.Signals) => unknown;
}): () => void {
  if (webviewPid == null) return () => {};
  let cleanup = () => {
    try {
      killImpl(-webviewPid, `SIGKILL`);
      return;
    } catch {}
    try {
      killImpl(webviewPid, `SIGKILL`);
    } catch {}
  };
  app.once(`will-quit`, cleanup);
  return () => app.off(`will-quit`, cleanup);
}
