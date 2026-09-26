// chatgpt-image-upload-reminder-dialog-entry —— 图片上传隐私提醒弹窗的公开入口桥。
// 原版：app/webview/assets/chatgpt-image-upload-reminder-dialog-e4f2b345949d.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as reminderDialogChunk from "@rchunk/chatgpt-image-upload-reminder-dialog-core";

void appSharedChunk;
const reminderDialog = reminderDialogChunk as Record<string, any>;

reminderDialog.n();

const ChatGptImageUploadReminderDialog = reminderDialog.t;

export { ChatGptImageUploadReminderDialog };
