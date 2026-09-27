// local-conversation-page-entry —— 本地与 App Server 会话页公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as pageChunk from "@rchunk/local-conversation-page";
void appSharedChunk;
const {
  n: LocalConversationPage,
  r: initializeLocalConversationPage,
  t: AppServerConversationPage,
} = pageChunk;
initializeLocalConversationPage();
export { AppServerConversationPage, LocalConversationPage };
