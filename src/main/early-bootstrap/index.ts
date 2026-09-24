// Electron 主进程入口（app/package.json 的 "main" 指向本 chunk 的输出）。
//
// macOS 上 Electron 会在 app ready 之前发出 open-file / open-url 事件，而此时
// 什么都还没初始化。所以在加载任何其他代码之前，先安装这两个事件的早期监听
// （把要打开的文件/链接暂存到 desktop-open-path-queue），然后再异步加载真正的
// 引导模块 bootstrap（Sentry、自动更新、主应用启动都在那边）。
import { installEarlyOpenPathListeners } from "@chunk/desktop-open-path-queue";

installEarlyOpenPathListeners(process.platform === "darwin");

// 与原版一致：微任务延迟的 CommonJS require（而非 ESM 动态 import）。
void Promise.resolve().then(() => require("@chunk/bootstrap"));
