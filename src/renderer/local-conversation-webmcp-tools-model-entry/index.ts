import {
  i as initializeLocalConversationWebMcpToolsModel,
  n as getWebMcpCallsForSummaryPanel,
  r as groupWebMcpCallsByName,
  t as getHostnameFromWebUrl,
} from "@rchunk/local-conversation-webmcp-tools-model";

initializeLocalConversationWebMcpToolsModel();

export {
  getHostnameFromWebUrl,
  getWebMcpCallsForSummaryPanel,
  groupWebMcpCallsByName,
};
