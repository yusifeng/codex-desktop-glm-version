// Computer Use 屏幕捕获请求管理（mac worker / Windows native bridge 双路径）。
//
// 对应 main-C-Mhak1n.ts 79,596-79,794：
//   - uM pendingCaptures（模块级 Map）+ fM CAPTURE_TIMEOUT_MS（2min）
//   - pM startMacCapture：worker RPC（start）+ permissions-pending 重试 +
//     失败分类（gr/hr：shared 的错误分类器）
//   - hM startWindowsCapture：native bridge 直连 + origin/signal 生命周期
//   - mM requestFinalCaptureUpdate
//   - gM dispatchCaptureUpdate：渲染层 computer-use-capture-updated 推送 +
//     completed/failed 自动清理
//   - _M finishCapture / vM failCapture / yM armCaptureTimeout
import { memoizedTaggedLogger } from "@chunk/logger";
import { gr as classifyPermissionState, hr as classifyErrorSource } from "@chunk/shared";

const pendingCaptures = new Map<string, PendingCapture>();
const captureLogger = memoizedTaggedLogger("computer-use-capture-handler");
const CAPTURE_TIMEOUT_MS = 120_000;

interface CaptureUpdate {
  type: string;
  [key: string]: unknown;
}

interface PendingCapture {
  origin: Electron.WebContents;
  windowManager: { sendInlineMessageForView(origin: Electron.WebContents, message: unknown): void };
  abortController: AbortController;
  permissionRequestId: string;
  startedAt: number;
  timeoutId: ReturnType<typeof setTimeout>;
  unsubscribe(): void;
}

interface WindowManagerLike {
  sendInlineMessageForView(origin: Electron.WebContents, message: unknown): void;
}

/** 超时布防（原 `yM`）：unref 的 2min 定时器，超时按 capture_timed_out 失败。 */
function armCaptureTimeout(requestId: string): ReturnType<typeof setTimeout> {
  const timer = setTimeout(() => {
    const capture = pendingCaptures.get(requestId);
    if (capture != null) {
      captureLogger().warning("Timed out waiting for Codex Computer Use capture", {
        safe: { requestId },
        sensitive: {},
      });
      failCapture(requestId, capture, "capture_timed_out");
    }
  }, CAPTURE_TIMEOUT_MS);
  (timer as ReturnType<typeof setTimeout> & { unref(): void }).unref();
  return timer;
}

/** 正常结束（原 `_M`）：移除记账 + abort + 退订。 */
function finishCapture(requestId: string, capture: PendingCapture): void {
  pendingCaptures.delete(requestId);
  clearTimeout(capture.timeoutId);
  capture.abortController.abort();
  capture.unsubscribe();
}

/** 失败结束（原 `vM`）：结束 + 渲染层 failed 推送。 */
function failCapture(requestId: string, capture: PendingCapture, failureReason: string): void {
  finishCapture(requestId, capture);
  capture.windowManager.sendInlineMessageForView(capture.origin, {
    requestId,
    type: "computer-use-capture-updated",
    update: { type: "failed", failureReason },
  });
}

/** 更新分发（原 `gM`）：推送渲染层，completed/failed 自动清理。 */
function dispatchCaptureUpdate(requestId: string, update: CaptureUpdate): void {
  const capture = pendingCaptures.get(requestId);
  if (capture == null) return;
  captureLogger().debug("Codex Computer Use capture update received", {
    safe: { requestId, updateType: update.type, elapsedMs: Date.now() - capture.startedAt },
    sensitive: {},
  });
  capture.windowManager.sendInlineMessageForView(capture.origin, {
    requestId,
    type: "computer-use-capture-updated",
    update,
  });
  if (update.type === "completed" || update.type === "failed") finishCapture(requestId, capture);
}

/** mac 路径捕获（原 `pM`）：worker RPC + permissions-pending 递归重试。 */
async function startMacCapture({
  animationTarget,
  bundleIdentifier,
  origin,
  requestComputerUseCaptureWorker,
  requestId,
  subscribeComputerUseCaptureWorkerEvent,
  windowManager,
}: {
  animationTarget: unknown;
  bundleIdentifier: string;
  origin: Electron.WebContents;
  requestComputerUseCaptureWorker: (request: { method: string; params: Record<string, unknown>; signal: AbortSignal }) => Promise<{ result: string }>;
  requestId: string;
  subscribeComputerUseCaptureWorkerEvent: (event: string, handler: (payload: { requestId: string; update: CaptureUpdate }) => void) => () => void;
  windowManager: WindowManagerLike;
}): Promise<{ result: string } | null> {
  if (bundleIdentifier.trim().length === 0 || requestId.trim().length === 0) return null;
  if (pendingCaptures.has(requestId)) {
    captureLogger().warning("Rejected duplicate Codex Computer Use capture request", {
      safe: { requestId },
      sensitive: {},
    });
    return null;
  }
  const startedAt = Date.now();
  const abortController = new AbortController();
  // 权限请求 id：复用首个在途请求的（权限弹窗去重，原 uM.values().next()）。
  const permissionRequestId = pendingCaptures.values().next().value?.permissionRequestId ?? requestId;
  const timeoutId = armCaptureTimeout(requestId);
  const unsubscribe = subscribeComputerUseCaptureWorkerEvent("update", (event) => {
    if (event.requestId === requestId) dispatchCaptureUpdate(event.requestId, event.update);
  });
  pendingCaptures.set(requestId, {
    origin,
    windowManager,
    abortController,
    permissionRequestId,
    startedAt,
    timeoutId,
    unsubscribe,
  });
  captureLogger().debug("Starting Codex Computer Use capture", {
    safe: { requestId, pendingCaptureCount: pendingCaptures.size },
    sensitive: {},
  });
  const attempt = async (): Promise<{ result: string } | null> => {
    if (!pendingCaptures.has(requestId)) return null;
    try {
      const response = await requestComputerUseCaptureWorker({
        method: "start",
        params: { animationTarget, bundleIdentifier, permissionRequestId, requestId },
        signal: abortController.signal,
      });
      const capture = pendingCaptures.get(requestId);
      if (capture != null) {
        if (response.result === "appshot_permissions_abandoned") {
          finishCapture(requestId, capture);
        } else {
          clearTimeout(capture.timeoutId);
          capture.timeoutId = armCaptureTimeout(requestId);
        }
      }
      captureLogger().debug("Codex Computer Use capture worker acknowledged start", {
        safe: { requestId, elapsedMs: Date.now() - startedAt, result: response.result },
        sensitive: {},
      });
      return response;
    } catch (error) {
      const capture = pendingCaptures.get(requestId);
      if (capture == null) return null;
      if ((classifyPermissionState as (error: unknown) => string)(error) === "pending") {
        captureLogger().debug("Codex Computer Use capture permissions are still pending; retrying start", {
          safe: { requestId },
          sensitive: {},
        });
        clearTimeout(capture.timeoutId);
        capture.timeoutId = armCaptureTimeout(requestId);
        return attempt();
      }
      const classified = (classifyErrorSource as (error: unknown) => { source: string; code: string } | null)(error);
      const failureReason = classified == null ? "start_request_failed" : `start_request_failed:${classified.source}:${classified.code}`;
      captureLogger().warning("Codex Computer Use capture worker failed", {
        safe: { failureReason, requestId },
        sensitive: { error },
      });
      failCapture(requestId, capture, failureReason);
      return null;
    }
  };
  return attempt();
}

/** 请求最终截图更新（原 `mM`）。 */
async function requestFinalCaptureUpdate({
  requestComputerUseCaptureUpdate,
  requestId,
}: {
  requestComputerUseCaptureUpdate: (request: { params: Record<string, unknown>; signal: AbortSignal }) => Promise<unknown>;
  requestId: string;
}): Promise<boolean> {
  const capture = pendingCaptures.get(requestId);
  if (capture == null) return false;
  clearTimeout(capture.timeoutId);
  capture.timeoutId = armCaptureTimeout(requestId);
  try {
    await requestComputerUseCaptureUpdate({ params: { requestId }, signal: capture.abortController.signal });
    return true;
  } catch (error) {
    captureLogger().warning("Codex Computer Use final capture update request failed", {
      safe: { requestId },
      sensitive: { error },
    });
    failCapture(requestId, capture, "final_update_request_failed");
    return false;
  }
}

/** Windows 路径捕获（原 `hM`）：native bridge 直连。 */
async function startWindowsCapture({
  animationTarget,
  bundleIdentifier,
  origin,
  requestId,
  signal,
  soundEnabled,
  windowManager,
  windowsCaptureNativeBridge,
}: {
  animationTarget: unknown;
  bundleIdentifier: string;
  origin: Electron.WebContents;
  requestId: string;
  signal?: AbortSignal;
  soundEnabled: boolean;
  windowManager: WindowManagerLike;
  windowsCaptureNativeBridge: {
    startCapture(opts: {
      animationTarget: unknown;
      bundleIdentifier: string;
      emitUpdate: (update: CaptureUpdate) => void;
      origin: Electron.WebContents;
      requestId: string;
      signal: AbortSignal;
      soundEnabled: boolean;
    }): Promise<unknown>;
  };
}): Promise<unknown> {
  if (
    bundleIdentifier.trim().length === 0 ||
    requestId.trim().length === 0 ||
    signal?.aborted === true ||
    origin.isDestroyed() ||
    pendingCaptures.has(requestId)
  )
    return null;
  const abortController = new AbortController();
  const capture: PendingCapture = {
    origin,
    windowManager,
    abortController,
    permissionRequestId: requestId,
    startedAt: Date.now(),
    timeoutId: armCaptureTimeout(requestId),
    unsubscribe: () => {
      signal?.removeEventListener("abort", onAborted);
      origin.removeListener("destroyed", onAborted);
    },
  };
  const onAborted = () => {
    if (pendingCaptures.get(requestId) === capture) finishCapture(requestId, capture);
  };
  pendingCaptures.set(requestId, capture);
  signal?.addEventListener("abort", onAborted, { once: true });
  origin.once("destroyed", onAborted);
  try {
    const started = await windowsCaptureNativeBridge.startCapture({
      animationTarget,
      bundleIdentifier,
      emitUpdate: (update) => dispatchCaptureUpdate(requestId, update),
      origin,
      requestId,
      signal: abortController.signal,
      soundEnabled,
    });
    return started == null || pendingCaptures.get(requestId) !== capture
      ? (pendingCaptures.get(requestId) === capture && finishCapture(requestId, capture), null)
      : started;
  } catch (error) {
    if (pendingCaptures.get(requestId) === capture) {
      captureLogger().warning("Windows Codex Computer Use capture failed to start", {
        safe: { requestId },
        sensitive: { error },
      });
      failCapture(requestId, capture, "start_request_failed");
    }
    return null;
  }
}

export {
  startMacCapture,
  startWindowsCapture,
  requestFinalCaptureUpdate,
  dispatchCaptureUpdate,
  CAPTURE_TIMEOUT_MS,
};
