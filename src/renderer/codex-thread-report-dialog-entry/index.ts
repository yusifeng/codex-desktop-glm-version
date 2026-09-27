// codex-thread-report-dialog-entry —— Codex 线程举报弹窗的公开入口桥。
// 原版：app/webview/assets/codex-thread-report-dialog-310fc6268fc1.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as reportDialogChunk from "@rchunk/codex-thread-report-dialog";

void appSharedChunk;
const {
  n: initializeCodexThreadReportDialog,
  t: CodexThreadReportDialog,
} = reportDialogChunk;

initializeCodexThreadReportDialog();

export { CodexThreadReportDialog };
