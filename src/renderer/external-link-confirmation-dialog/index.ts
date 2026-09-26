// external-link-confirmation-dialog —— 外部链接确认弹窗的公开入口。
// 原版：app/webview/assets/external-link-confirmation-dialog-fba2e6da1d8c.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void appSharedChunk;
const appInitial = appInitialChunk as Record<string, any>;

appInitial.ist();

const ExternalLinkConfirmationDialog = appInitial.rst;

export { ExternalLinkConfirmationDialog };
