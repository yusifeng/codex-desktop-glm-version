// chatgpt-work-home-page-entry —— ChatGPT Work 首页公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as pageChunk from "@rchunk/chatgpt-work-home-page-core";
void appSharedChunk;
const { n: initializeChatGptWorkHomePage, t: ChatGptWorkHomePage } = pageChunk;
initializeChatGptWorkHomePage();
export { ChatGptWorkHomePage };
