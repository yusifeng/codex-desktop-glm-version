// trusted-contact-no-thanks-dialog —— 受信任联系人“暂不”确认弹窗的公开入口。
// 原版：app/webview/assets/trusted-contact-no-thanks-dialog-30da77d2d792.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void appSharedChunk;
const {
  vL: TrustedContactNoThanksDialog,
  yL: initializeTrustedContactNoThanksDialog,
} = appInitialChunk;

initializeTrustedContactNoThanksDialog();

export { TrustedContactNoThanksDialog };
