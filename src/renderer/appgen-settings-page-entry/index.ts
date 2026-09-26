// appgen-settings-page-entry —— Site 设置页面的公开路由入口。
// 原版：app/webview/assets/appgen-settings-page-ea4f4a5684c3.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as settingsPageChunk from "@rchunk/appgen-settings-page";

void appSharedChunk;
const {
  n: AppgenSettingsPage,
  r: initializeAppgenSettingsPage,
} = settingsPageChunk;

initializeAppgenSettingsPage();

export { AppgenSettingsPage };
