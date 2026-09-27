// library-file-picker-dialog —— 文件库选择弹窗的公开入口。
// 原版：app/webview/assets/library-file-picker-dialog-ed1f608e5734.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";

void appSharedChunk;
void appInitialChunk;
const {
  no: initializeLibraryFilePickerDialog,
  to: LibraryFilePickerDialog,
} = appPrimaryChunk;

initializeLibraryFilePickerDialog();

export { LibraryFilePickerDialog };
