// 启动早期的「打开文件 / 打开链接」事件队列。
//
// macOS 上双击文件、点 codex:// 链接时，Electron 会在 app ready 之前发出
// open-file / open-url 事件，此时主窗口和 IPC 都还没就绪。入口（early-bootstrap）
// 在最早期调用 installEarlyOpenPathListeners 把这些事件暂存：
//   - 文件路径等到主进程就绪后通过 setOpenFilesHandler(handler) 一次性取走；
//   - URL 先入队，等 deep link 处理方调用 takePendingUrls() 取走。
// 非 macOS 平台不安装监听（Windows/Linux 的启动参数由主进程另行解析）。
import { fileURLToPath } from "node:url";
import { app } from "electron";

export type OpenFilesHandler = (paths: string[]) => void;

let pendingFiles: string[] = [];
let pendingUrls: string[] = [];
let filesHandler: OpenFilesHandler | null = null;
// 已安装监听的标记（用 open-file 监听函数本身作对比句柄）。
let installedOpenFileListener: ((event: Electron.Event, path: string) => void) | null = null;
// takePendingUrls 调用过后，非文件型 URL 不再入队（deep link 处理已错过时机）。
let urlQueueSealed = false;

/** 文件路径入队；已有处理器时直接回调。空数组返回 false。 */
export function enqueueOpenFiles(paths: string[]): boolean {
  if (paths.length === 0) return false;
  if (filesHandler == null) {
    pendingFiles.push(...paths);
  } else {
    filesHandler(paths);
  }
  return true;
}

function enqueueOpenUrls(urls: string[]): boolean {
  return urls.length !== 0 && (pendingUrls.push(...urls), true);
}

/** 取走全部排队的 URL，并封存队列（此后 open-url 事件不再入队）。 */
export function takePendingUrls(): string[] {
  urlQueueSealed = true;
  return pendingUrls.splice(0, pendingUrls.length);
}

/** 设置文件处理器并取走排队的文件。 */
export function setOpenFilesHandler(handler: OpenFilesHandler): string[] {
  filesHandler = handler;
  return pendingFiles.splice(0, pendingFiles.length);
}

/** 释放文件处理器（一般由 setOpenFilesHandler 的持有方在退出时调用）。 */
export function releaseOpenFilesHandler(handler: OpenFilesHandler): void {
  if (filesHandler === handler) filesHandler = null;
}

/**
 * 注册 open-file / open-url 的早期监听。
 * enabled 为 false（非 macOS）或已注册时无操作。返回反注册函数。
 */
export function installEarlyOpenPathListeners(enabled: boolean): () => void {
  if (!enabled || installedOpenFileListener != null) return () => {};

  const onOpenFile = (event: Electron.Event, path: string) => {
    event.preventDefault();
    enqueueOpenFiles([path]);
  };

  const onOpenUrl = (event: Electron.Event, url: string) => {
    let filePath: string;
    try {
      filePath = fileURLToPath(url);
    } catch {
      // 不是 file:// URL。deep link 队列已消费过就丢弃，避免在启动完成后
      // 重复打开早已处理不了的链接。
      if (urlQueueSealed) return;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return;
      }
      if (
        parsed.protocol !== "codex:" &&
        parsed.protocol !== "codex-dev:" &&
        parsed.protocol !== "http:" &&
        parsed.protocol !== "https:"
      ) {
        return;
      }
      event.preventDefault();
      enqueueOpenUrls([url]);
      return;
    }
    event.preventDefault();
    enqueueOpenFiles([filePath]);
  };

  installedOpenFileListener = onOpenFile;
  app.on("open-file", onOpenFile);
  app.on("open-url", onOpenUrl);
  return () => {
    if (installedOpenFileListener !== onOpenFile) return;
    app.removeListener("open-file", onOpenFile);
    app.removeListener("open-url", onOpenUrl);
    installedOpenFileListener = null;
  };
}

// ---- 兼容导出（发布版的单字母导出名，未还原 chunk 在使用）----
export { takePendingUrls as a };
export { setOpenFilesHandler as i };
export { enqueueOpenFiles as n };
export { installEarlyOpenPathListeners as r };
export { releaseOpenFilesHandler as t };
