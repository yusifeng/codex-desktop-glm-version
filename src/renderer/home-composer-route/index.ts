// home-composer-route —— 首页 Composer 路由公开入口。
//
// 原版：app/webview/assets/home-composer-route-a340373310ac.js（153B）。
// 保留 app-shared 初始化依赖，调用 app-primary 的初始化器 `n`，并将真实
// 路由组件压缩导出 `t` 转发为 HomeComposerRoute。

import "@rchunk/app-shared";
import { n as initializeHomeComposerRoute, t as HomeComposerRoute } from "@rchunk/app-primary";

initializeHomeComposerRoute();

export { HomeComposerRoute };
