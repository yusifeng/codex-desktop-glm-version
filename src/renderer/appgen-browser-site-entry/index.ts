// appgen-browser-site-entry —— Site 浏览器 URL 匹配逻辑的公开入口。
// 原版：app/webview/assets/appgen-browser-site-af7344723817.js。

import * as browserSiteChunk from "@rchunk/appgen-browser-site-core";

const browserSite = browserSiteChunk as Record<string, any>;

browserSite.n();

const getAppgenBrowserSiteForUrl = browserSite.t;

export { getAppgenBrowserSiteForUrl };
