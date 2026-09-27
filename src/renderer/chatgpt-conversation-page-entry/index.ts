// chatgpt-conversation-page-entry —— ChatGPT 会话与分享会话页公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as pageChunk from "@rchunk/chatgpt-conversation-page-core";
void appSharedChunk;
const {
  c: initializeChatGptConversationPages,
  i: ChatGptConversationPage,
  s: ChatGptSharedConversationPage,
} = pageChunk;
initializeChatGptConversationPages();
export { ChatGptConversationPage, ChatGptSharedConversationPage };
