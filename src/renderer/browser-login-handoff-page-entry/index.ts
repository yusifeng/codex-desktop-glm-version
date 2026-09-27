// browser-login-handoff-page-entry —— 浏览器登录回跳页面公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as pageChunk from "@rchunk/browser-login-handoff-page-core";
void appSharedChunk;
void appInitialChunk;
const {
  n: initializeBrowserLoginHandoffPage,
  t: BrowserLoginHandoffPage,
} = pageChunk;
initializeBrowserLoginHandoffPage();
export { BrowserLoginHandoffPage };
