// mcp-extension-view-page-entry —— MCP 扩展全局/设置 View 页面公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as pageChunk from "@rchunk/mcp-extension-view-page-core";
void appSharedChunk;
const {
  i: initializeMcpExtensionViewPages,
  n: McpExtensionSettingsViewPage,
  r: McpExtensionViewNotFoundState,
  t: McpExtensionGlobalViewPage,
} = pageChunk;
initializeMcpExtensionViewPages();
export {
  McpExtensionGlobalViewPage,
  McpExtensionSettingsViewPage,
  McpExtensionViewNotFoundState,
};
