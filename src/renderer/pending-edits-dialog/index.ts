// pending-edits-dialog —— 写作块存在待处理 AI 编辑时的关闭确认弹窗。
// 原版：app/webview/assets/pending-edits-dialog-ff879da48a98.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeJsxRuntime,
  Ah: DialogHeader,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeIntlRuntime,
  Lh: DialogDescription,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
  jh: DialogSection,
  kh: DialogFooter,
  zh: initializeDialog,
} = appSharedChunk;

let jsxRuntime: JsxRuntime | null = null;

interface PendingEditsDialogProps {
  onCancel(): void;
  onConfirm(): void;
  open: boolean;
}

interface FormSubmitEvent {
  preventDefault(): void;
}

function PendingEditsDialog({
  onCancel,
  onConfirm,
  open,
}: PendingEditsDialogProps): unknown {
  if (!open) return null;
  const jsx = getInitializedJsxRuntime();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onCancel();
  };
  const handleSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    onConfirm();
  };
  const title = jsx.jsx(DialogTitle, {
    children: jsx.jsx(FormattedMessage, {
      id: "codex.writingBlock.confirmCloseTitle",
      defaultMessage: "Close editor?",
      description:
        "Title of the confirmation dialog when leaving an expanded writing block with pending AI edits.",
    }),
  });
  const heading = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogHeader, {
      title,
      subtitle: jsx.jsx(DialogDescription, {
        children: jsx.jsx(FormattedMessage, {
          id: "codex.writingBlock.confirmClosePendingEdits",
          defaultMessage:
            "You have pending edits - are you sure you want to close?",
          description:
            "Confirmation before closing or replacing an expanded writing block with an in-progress or unresolved AI edit, matching ChatGPT.",
        }),
      }),
    }),
  });
  const cancelButton = jsx.jsx(Button, {
    color: "outline",
    onClick: onCancel,
    type: "button",
    children: jsx.jsx(FormattedMessage, {
      id: "codex.writingBlock.confirmCloseCancel",
      defaultMessage: "Cancel",
      description:
        "Cancel leaving an expanded writing block with pending AI edits.",
    }),
  });
  const closeButton = jsx.jsx(Button, {
    color: "primary",
    type: "submit",
    children: jsx.jsx(FormattedMessage, {
      id: "codex.writingBlock.confirmCloseConfirm",
      defaultMessage: "Close",
      description:
        "Confirm leaving an expanded writing block with pending AI edits.",
    }),
  });
  const footer = jsx.jsx(DialogSection, {
    children: jsx.jsxs(DialogFooter, {
      children: [cancelButton, closeButton],
    }),
  });
  const form = jsx.jsxs(DialogBody, {
    as: "form",
    onSubmit: handleSubmit,
    children: [heading, footer],
  });

  return jsx.jsx(Dialog, {
    open: true,
    onOpenChange: handleOpenChange,
    size: "compact",
    children: form,
  });
}

function initializePendingEditsDialog(): void {
  if (jsxRuntime != null) return;
  initializeJsxRuntime();
  initializeIntlRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  jsxRuntime = getJsxRuntime();
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializePendingEditsDialog();
  if (jsxRuntime == null) {
    throw new Error("Pending edits dialog JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

initializePendingEditsDialog();

export { initializePendingEditsDialog as n, PendingEditsDialog as t };
