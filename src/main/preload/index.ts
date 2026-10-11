// 渲染进程 preload（Codex 主窗口）。
//
// 职责（按执行顺序）：
//   1. 初始化 Sentry 的 preload IPC 通道；
//   2. 同步拉取启动配置（Sentry 选项、构建 flavor、共享对象快照、系统主题），
//      尽早把主题写到 <html data-theme>；
//   3. 组装 electronBridge 并通过 contextBridge 暴露给页面；
//   4. 注册主进程 → 页面的消息转发（普通消息、MCP 沙箱宿主消息、PIP 视频帧）；
//   5. 处理页面发起的 connect-app-host（MessagePort 交给主进程）。
import { contextBridge, ipcRenderer } from "electron";
import { initSentryIpc } from "./sentry-ipc";
import { isChunkedHostMessage } from "./chunked-message";
import {
  MESSAGE_FOR_VIEW,
  MCP_APP_SANDBOX_HOST_MESSAGE,
  SYSTEM_THEME_VARIANT_UPDATED,
  GET_SENTRY_INIT_OPTIONS,
  GET_BUILD_FLAVOR,
  GET_SYSTEM_THEME_VARIANT,
  CONNECT_APP_HOST,
} from "./ipc-channels";
import { initSharedObjectSnapshot, setSharedObjectValue } from "./shared-object-snapshot";
import { registerPipVideoFrameHandler, disposeDecodersForRemovedPresentations } from "./pip-video-decoder";
import { createSystemThemeVariantController } from "./system-theme-variant-controller";
import { createViewMessageRouterController } from "./view-message-router-controller";
import { createConnectAppHostController } from "./connect-app-host-controller";
import {
  createElectronBridge,
  WINDOW_TYPE,
  type SentryInitOptions,
} from "./electron-bridge";

initSentryIpc();

const preloadStartedAtMs = performance.timeOrigin;
const sentryInitOptions = ipcRenderer.sendSync(GET_SENTRY_INIT_OPTIONS) as SentryInitOptions;
const buildFlavor = ipcRenderer.sendSync(GET_BUILD_FLAVOR);
initSharedObjectSnapshot();
let systemThemeVariant = ipcRenderer.sendSync(GET_SYSTEM_THEME_VARIANT) as string;
const systemThemeVariantController = createSystemThemeVariantController(systemThemeVariant, {
  getDocumentElement: () => document.documentElement,
  observeDocument: (onReady) => {
    const observer = new MutationObserver(onReady);
    observer.observe(document, { childList: true });
    return () => observer.disconnect();
  },
});
ipcRenderer.on(SYSTEM_THEME_VARIANT_UPDATED, (_event, variant: string) => {
  systemThemeVariantController.update(variant);
});

const electronBridge = createElectronBridge({
  sentryInitOptions,
  preloadStartedAtMs,
  buildFlavor,
  getSystemThemeVariant: () => systemThemeVariantController.get(),
  subscribeToSystemThemeVariant: (callback) => systemThemeVariantController.subscribe(callback),
});

const viewMessageRouterController = createViewMessageRouterController({
  isChunkedHostMessage,
  setSharedObjectValue,
  disposePipLayout: disposeDecodersForRemovedPresentations,
  dispatchMessage: (message) => window.dispatchEvent(new MessageEvent("message", { data: message })),
});

// 主进程 → 页面的普通消息：非「宿主分块消息」时同步本地共享对象快照 /
// 清理 PIP 解码器，然后以 DOM message 事件派发给页面代码。
ipcRenderer.on(MESSAGE_FOR_VIEW, (_event, message: unknown) => {
  viewMessageRouterController.route(message);
});

// MCP 沙箱宿主消息：连同 MessagePort 一起转发进页面（origin 非空时）。
ipcRenderer.on(MCP_APP_SANDBOX_HOST_MESSAGE, (event, message: unknown) => {
  const origin = window.location.origin;
  if (origin !== "null") window.postMessage(message, origin, event.ports);
});

registerPipVideoFrameHandler();

contextBridge.exposeInMainWorld("codexWindowType", WINDOW_TYPE);
contextBridge.exposeInMainWorld("electronBridge", electronBridge);

// 页面请求连接 app host：把 port 所有权转交主进程。
createConnectAppHostController({
  addMessageListener: (listener) => window.addEventListener("message", listener as EventListener),
  removeMessageListener: (listener) => window.removeEventListener("message", listener as EventListener),
  postMessage: (channel, message, transfer) => ipcRenderer.postMessage(channel, message, transfer),
  channel: CONNECT_APP_HOST,
  windowSource: window,
});
