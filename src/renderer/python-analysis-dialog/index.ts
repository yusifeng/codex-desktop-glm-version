// python-analysis-dialog —— 展示助手响应背后的只读 Python 源码与输出。
// 原版：app/webview/assets/analysis-dialog-4ded90e8b816.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as analysisDetailsChunk from "@rchunk/python-analysis-details";
import type { PythonAnalysisItem } from "@rchunk/python-analysis-details";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeJsxRuntime,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeIntlRuntime,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  zh: initializeDialog,
} = appSharedChunk;
const {
  n: initializePythonAnalysisDetails,
  t: PythonAnalysisDetails,
} = analysisDetailsChunk;

let jsxRuntime: JsxRuntime | null = null;

interface PythonAnalysisDialogProps {
  items: PythonAnalysisItem[];
  onClose(): void;
  onCloseAutoFocus?: (event: unknown) => void;
}

function PythonAnalysisDialog({
  items,
  onClose,
  onCloseAutoFocus,
}: PythonAnalysisDialogProps): unknown {
  const jsx = getInitializedJsxRuntime();
  const content = jsx.jsxs(DialogBody, {
    className:
      "max-h-[calc(100dvh/var(--codex-window-zoom)-2rem)] min-h-0 overflow-hidden",
    variant: "chatgpt",
    children: [
      jsx.jsx(DialogTitle, {
        className: "shrink-0 p-4 pe-14 text-lg font-normal select-none",
        children: jsx.jsx(FormattedMessage, {
          id: "chatgpt.pythonExecution.analysisTitle",
          defaultMessage: "Analysis",
          description:
            "Title of the dialog displaying read-only Python source and output",
        }),
      }),
      jsx.jsx("div", {
        className: "min-h-0 overflow-y-auto p-4 pt-1",
        children: jsx.jsx("div", {
          className: "flex min-w-0 flex-col gap-4",
          children: items.map((item) =>
            jsx.jsx(PythonAnalysisDetails, { item }, item.id),
          ),
        }),
      }),
    ],
  });
  return jsx.jsx(Dialog, {
    open: true,
    contentProps: {
      "aria-describedby": undefined,
      onCloseAutoFocus,
    },
    onOpenChange: (open: boolean) => {
      if (!open) onClose();
    },
    size: "large",
    variant: "chatgpt",
    children: content,
  });
}

function initializePythonAnalysisDialog(): void {
  if (jsxRuntime != null) return;
  initializeJsxRuntime();
  initializeIntlRuntime();
  initializeDialog();
  initializeDialogLayout();
  initializePythonAnalysisDetails();
  jsxRuntime = getJsxRuntime();
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializePythonAnalysisDialog();
  if (jsxRuntime == null) {
    throw new Error("Python analysis dialog JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

initializePythonAnalysisDialog();

export { PythonAnalysisDialog };
