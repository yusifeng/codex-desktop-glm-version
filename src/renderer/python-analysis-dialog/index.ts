// python-analysis-dialog —— 展示助手响应背后的只读 Python 源码与输出。
// 原版：app/webview/assets/analysis-dialog-4ded90e8b816.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as analysisDetailsChunk from "@rchunk/python-analysis-details";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const analysisDetails = analysisDetailsChunk as Record<string, any>;
const jsx = appShared.I3();

function PythonAnalysisDialog({
  items,
  onClose,
  onCloseAutoFocus,
}: {
  items: Array<{ id: string; [key: string]: unknown }>;
  onClose: () => void;
  onCloseAutoFocus?: (event: unknown) => void;
}) {
  const content = jsx.jsxs(appShared.Oh, {
    className:
      "max-h-[calc(100dvh/var(--codex-window-zoom)-2rem)] min-h-0 overflow-hidden",
    variant: "chatgpt",
    children: [
      jsx.jsx(appShared.Rh, {
        className: "shrink-0 p-4 pe-14 text-lg font-normal select-none",
        children: jsx.jsx(appShared.Y2, {
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
            jsx.jsx(analysisDetails.t, { item }, item.id),
          ),
        }),
      }),
    ],
  });
  return jsx.jsx(appShared.Ih, {
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
  appShared.$3?.();
  appShared.K2?.();
  appShared.zh?.();
  appShared.Ph?.();
  analysisDetails.n?.();
}

initializePythonAnalysisDialog();

export { PythonAnalysisDialog };
