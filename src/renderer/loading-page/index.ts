// loading-page —— 应用加载页公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
void appSharedChunk;
const { Let: LoadingPage, Ret: initializeLoadingPage } = appInitialChunk;
initializeLoadingPage();
export { LoadingPage };
