// library-file-picker-dialog —— 文件库选择弹窗的公开入口。
// 原版：app/webview/assets/library-file-picker-dialog-ed1f608e5734.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";

void appSharedChunk;
void appInitialChunk;
const appPrimary = appPrimaryChunk as Record<string, any>;

appPrimary.no();

const LibraryFilePickerDialog = appPrimary.to;

export { LibraryFilePickerDialog };
