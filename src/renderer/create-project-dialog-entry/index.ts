// create-project-dialog-entry —— ChatGPT 项目创建弹窗的公开入口桥。
// 原版：app/webview/assets/create-project-dialog-d42e97abdb89.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as createProjectDialogChunk from "@rchunk/create-project-dialog-core";

void appSharedChunk;
void appInitialChunk;
const createProjectDialog = createProjectDialogChunk as Record<string, any>;

createProjectDialog.r();

const CreateProjectDialog = createProjectDialog.t;

export { CreateProjectDialog };
