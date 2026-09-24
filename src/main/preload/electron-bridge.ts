// 暴露给渲染进程页面的 electronBridge（contextBridge.exposeInMainWorld）。
//
// 页面代码（webview 侧）通过 window.electronBridge 与主进程通信：
// 消息收发、worker 线程订阅、文件拖拽、右键菜单、主题、Sentry 配置等。
import { ipcRenderer, webUtils } from "electron";
import {
  ACK_CHUNKED_MESSAGE,
  MESSAGE_FROM_VIEW,
  SHOW_CONTEXT_MENU,
  START_FILE_DRAG,
  START_LINK_DRAG,
  GET_FAST_MODE_ROLLOUT_METRICS,
  GET_INITIAL_SIDEBAR_BOOTSTRAP,
  TRIGGER_SENTRY_TEST,
  workerFromViewChannel,
  workerForViewChannel,
} from "./ipc-channels";
import { getSharedObjectSnapshotValue, setSharedObjectValue } from "./shared-object-snapshot";
import { buildDesktopUserAgent } from "./user-agent";

/** 窗口类型标识，页面据此区分运行环境。 */
export const WINDOW_TYPE = "electron";

export interface SentryInitOptions {
  appVersion: string;
  codexAppSessionId: string;
  [key: string]: unknown;
}

export interface ElectronBridge {
  readonly windowType: typeof WINDOW_TYPE;
  acknowledgeChunkedMessage(transferId: string, sequence: number): void;
  getPreloadStartedAtMs(): number;
  sendMessageFromView(message: { type: string; [key: string]: unknown }): Promise<void>;
  getPathForFile(file: File): string | null;
  startFileDrag(request: unknown): boolean;
  startLinkDrag(request: unknown): void;
  sendWorkerMessageFromView(workerName: string, message: unknown): Promise<void>;
  subscribeToWorkerMessages(workerName: string, callback: (message: unknown) => void): () => void;
  showContextMenu(options: unknown): Promise<unknown>;
  getFastModeRolloutMetrics(request: unknown): Promise<unknown>;
  getSharedObjectSnapshotValue(key: string): unknown;
  getInitialSidebarBootstrap(): unknown;
  getSystemThemeVariant(): string;
  subscribeToSystemThemeVariant(callback: () => void): () => void;
  triggerSentryTestError(): Promise<void>;
  getSentryInitOptions(): SentryInitOptions;
  getDesktopUserAgent(): string;
  getAppSessionId(): string;
  getBuildFlavor(): unknown;
  isDeviceCheckSupported(): boolean;
  isIntelMacBuild(): boolean;
}

// 每个 worker 名一组订阅回调；ipcRenderer 监听器按 worker 名懒注册、最后一个
// 订阅者离开时注销。
const workerMessageListeners = new Map<string, Set<(message: unknown) => void>>();
const workerIpcHandlers = new Map<string, (_event: unknown, message: unknown) => void>();

function subscribeToWorkerMessages(
  workerName: string,
  callback: (message: unknown) => void,
): () => void {
  let listeners = workerMessageListeners.get(workerName);
  if (!listeners) {
    listeners = new Set();
    workerMessageListeners.set(workerName, listeners);
  }
  let ipcHandler = workerIpcHandlers.get(workerName);
  if (!ipcHandler) {
    ipcHandler = (_event: unknown, message: unknown) => {
      const current = workerMessageListeners.get(workerName);
      current?.forEach((listener) => {
        listener(message);
      });
    };
    workerIpcHandlers.set(workerName, ipcHandler);
    ipcRenderer.on(workerForViewChannel(workerName), ipcHandler as never);
  }
  listeners.add(callback);
  return () => {
    const current = workerMessageListeners.get(workerName);
    if (!current || (current.delete(callback), current.size > 0)) return;
    workerMessageListeners.delete(workerName);
    const handler = workerIpcHandlers.get(workerName);
    if (handler) ipcRenderer.removeListener(workerForViewChannel(workerName), handler as never);
    workerIpcHandlers.delete(workerName);
  };
}

export function createElectronBridge(options: {
  sentryInitOptions: SentryInitOptions;
  preloadStartedAtMs: number;
  buildFlavor: unknown;
  getSystemThemeVariant: () => string;
  subscribeToSystemThemeVariant: (callback: () => void) => () => void;
}): ElectronBridge {
  const { sentryInitOptions, preloadStartedAtMs, buildFlavor } = options;
  let initialSidebarBootstrap: unknown;

  return {
    windowType: WINDOW_TYPE,
    acknowledgeChunkedMessage: (transferId, sequence) => {
      ipcRenderer.send(ACK_CHUNKED_MESSAGE, transferId, sequence);
    },
    getPreloadStartedAtMs: () => preloadStartedAtMs,
    sendMessageFromView: async (message) => {
      if (message.type === "shared-object-set") {
        setSharedObjectValue(message.key as string, message.value);
      }
      await ipcRenderer.invoke(MESSAGE_FROM_VIEW, message);
    },
    getPathForFile: (file) => webUtils.getPathForFile(file) || null,
    startFileDrag: (request) => ipcRenderer.sendSync(START_FILE_DRAG, request) === true,
    startLinkDrag: (request) => {
      ipcRenderer.send(START_LINK_DRAG, request);
    },
    sendWorkerMessageFromView: async (workerName, message) => {
      await ipcRenderer.invoke(workerFromViewChannel(workerName), message);
    },
    subscribeToWorkerMessages,
    showContextMenu: async (menuOptions) => ipcRenderer.invoke(SHOW_CONTEXT_MENU, menuOptions),
    getFastModeRolloutMetrics: async (request) =>
      ipcRenderer.invoke(GET_FAST_MODE_ROLLOUT_METRICS, request),
    getSharedObjectSnapshotValue,
    getInitialSidebarBootstrap: () => {
      if (initialSidebarBootstrap === undefined) {
        initialSidebarBootstrap = ipcRenderer.sendSync(GET_INITIAL_SIDEBAR_BOOTSTRAP);
      }
      return initialSidebarBootstrap;
    },
    getSystemThemeVariant: options.getSystemThemeVariant,
    subscribeToSystemThemeVariant: options.subscribeToSystemThemeVariant,
    triggerSentryTestError: async () => {
      await ipcRenderer.invoke(TRIGGER_SENTRY_TEST);
    },
    getSentryInitOptions: () => sentryInitOptions,
    getDesktopUserAgent: () =>
      buildDesktopUserAgent({ appVersion: sentryInitOptions.appVersion }),
    getAppSessionId: () => sentryInitOptions.codexAppSessionId,
    getBuildFlavor: () => buildFlavor,
    isDeviceCheckSupported: () => process.platform === "darwin" && process.arch === "arm64",
    isIntelMacBuild: () => process.platform === "darwin" && process.arch === "x64",
  };
}
