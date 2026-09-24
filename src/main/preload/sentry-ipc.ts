// Sentry Electron 的 preload 侧 IPC 引导（从 @sentry/electron 打包内联而来）。
//
// 在渲染进程暴露 window.__SENTRY_IPC__，Sentry SDK 通过它把事件/日志/指标
// 经 ipcRenderer 发回主进程。通道名按 namespace（默认 sentry-ipc）隔离，
// 多实例互不冲突。
import { contextBridge, ipcRenderer } from "electron";

// 原版打包残留的 IPC 模式枚举（Classic/Protocol/Both），未被使用，保留以对齐。
export enum SentryIpcMode {
  Classic = 1,
  Protocol = 2,
  Both = 3,
}

interface SentryIpcNamespace {
  namespace: string;
  createUrl: (subnamespace: string) => string;
  urlMatches: (url: string, subnamespace: string) => boolean;
  createKey: (channel: string) => string;
}

function createNamespace(namespace: string): SentryIpcNamespace {
  return {
    createUrl: (subnamespace: string) => `${namespace}://${subnamespace}/sentry_key`,
    urlMatches: function (url: string, subnamespace: string) {
      return url.startsWith(this.createUrl(subnamespace));
    },
    createKey: (channel: string) => `${namespace}.${channel}`,
    namespace,
  };
}

declare global {
  interface Window {
    __SENTRY_IPC__?: Record<string, Record<string, (channel: string, ...args: unknown[]) => void>>;
  }
}

export function initSentryIpc(namespaceName: string = "sentry-ipc") {
  const namespace = createNamespace(namespaceName);
  window.__SENTRY_IPC__ = window.__SENTRY_IPC__ || {};
  if (window.__SENTRY_IPC__[namespace.namespace]) {
    console.log("Sentry Electron preload has already been run");
    return;
  }
  const ipc = {
    sendRendererStart: () => ipcRenderer.send(namespace.createKey("start")),
    sendScope: (scope: unknown) => ipcRenderer.send(namespace.createKey("scope"), scope),
    sendEnvelope: (envelope: unknown) => ipcRenderer.send(namespace.createKey("envelope"), envelope),
    sendStatus: (status: unknown) => ipcRenderer.send(namespace.createKey("status"), status),
    sendStructuredLog: (log: unknown) =>
      ipcRenderer.send(namespace.createKey("structured-log"), log),
    sendMetric: (metric: unknown) => ipcRenderer.send(namespace.createKey("metric"), metric),
  };
  window.__SENTRY_IPC__[namespace.namespace] = ipc;
  try {
    contextBridge.exposeInMainWorld("__SENTRY_IPC__", window.__SENTRY_IPC__);
  } catch {
    // exposeInMainWorld 在部分环境（如已暴露过）会抛错，忽略。
  }
}
