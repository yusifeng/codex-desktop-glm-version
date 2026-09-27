// plan-downgrade-dialog-entry —— 套餐降级弹窗的公开入口桥。
// 原版：app/webview/assets/downgrade-dialog-f17eabadb9d1.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as downgradeDialogChunk from "@rchunk/plan-downgrade-dialog-core";

void appSharedChunk;
const {
  n: initializePlanDowngradeDialog,
  t: PlanDowngradeDialog,
} = downgradeDialogChunk;

initializePlanDowngradeDialog();

export { PlanDowngradeDialog };
