// plugin-share-dialog-entry —— 插件分享权限弹窗的公开入口桥。
// 原版：app/webview/assets/plugin-share-dialog-18ba109ab37f.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as pluginShareDialogChunk from "@rchunk/plugin-share-dialog-core";

void appSharedChunk;
const {
  n: initializePluginShareDialog,
  t: PluginShareDialog,
} = pluginShareDialogChunk;

initializePluginShareDialog();

export { PluginShareDialog };
