// mcp-app-follow-up-confirmation-dialog —— MCP 应用后续操作确认弹窗的公开入口。
// 原版：app/webview/assets/mcp-app-follow-up-confirmation-dialog-df46c0e00ea9.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void appSharedChunk;
const {
  AX: initializeMcpAppFollowUpConfirmationDialog,
  kX: McpAppFollowUpConfirmationDialog,
} = appInitialChunk;

initializeMcpAppFollowUpConfirmationDialog();

export { McpAppFollowUpConfirmationDialog };
