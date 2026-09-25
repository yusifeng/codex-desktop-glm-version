// rpc chunk —— 渲染进程的服务初始化门面。
//
// 原版：app/webview/assets/rpc-971deaddf2c2.js（8 行）
//   import { fnt as e, hnt as t, mnt as n, pnt as r } from "./app-initial-51da50e6c6e3.js";
//   n();
//   export { e as appHost, r as appServices, t as initializeAppHostServices };
//
// 对应 app-initial 内部（行号见 /Users/david/Workspace/ppio_github/chatgpt-desktop-src）：
//   - fnt = wGi：appHost（sbe(xGi) 的返回值，xGi 为 AppHostServices 容器实例，
//     含 appActions/appUpdates/clientCoordination/downloads/threadReadState/
//     statsig/terminal/devboxService）
//   - hnt = CGi：initializeAppHostServices——初始化 appHost 并逐项启动各服务
//     （threadReadState.initialize / statsig / clientCoordination / terminal）
//   - mnt = sU：懒初始化器（触发 Sentry/遥测等基础设施装配）
//   - pnt = oU：appServices（await appHost.services 的结果）
//
// 本 chunk 在 index-entry 的动态加载序列中先于 app-initial 主体执行，
// 确保服务容器在 React 渲染前就绪。

import { fnt as appHost, hnt as initializeAppHostServices, mnt as initializeRpcInfrastructure, pnt as appServices } from "@rchunk/app-initial";

initializeRpcInfrastructure();

export { appHost, appServices, initializeAppHostServices };
