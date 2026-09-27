// scheduled-shared-task-dialog-entry —— 共享定时任务弹窗的公开入口桥。
// 原版：app/webview/assets/shared-task-dialog-a2c91900efa2.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as sharedTaskDialogChunk from "@rchunk/scheduled-shared-task-dialog-core";

void appSharedChunk;
const {
  n: initializeScheduledSharedTaskDialog,
  t: ScheduledSharedTaskDialog,
} = sharedTaskDialogChunk;

initializeScheduledSharedTaskDialog();

export { ScheduledSharedTaskDialog };
