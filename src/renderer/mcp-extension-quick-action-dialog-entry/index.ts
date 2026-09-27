// mcp-extension-quick-action-dialog-entry —— MCP 扩展快捷操作弹窗的公开入口桥。
// 原版：app/webview/assets/quick-action-dialog-266a8db4b6b9.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as quickActionDialogChunk from "@rchunk/mcp-extension-quick-action-dialog-core";

void appSharedChunk;
const {
  n: initializeMcpExtensionQuickActionDialog,
  t: McpExtensionQuickActionDialog,
} = quickActionDialogChunk;

initializeMcpExtensionQuickActionDialog();

export { McpExtensionQuickActionDialog };
