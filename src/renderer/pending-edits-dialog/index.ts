// pending-edits-dialog —— 写作块存在待处理 AI 编辑时的关闭确认弹窗。
// 原版：app/webview/assets/pending-edits-dialog-ff879da48a98.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const jsx = appShared.I3();

function PendingEditsDialog({
  onCancel,
  onConfirm,
  open,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}) {
  if (!open) return null;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onCancel();
  };
  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    onConfirm();
  };
  const title = jsx.jsx(appShared.Rh, {
    children: jsx.jsx(appShared.Y2, {
      id: "codex.writingBlock.confirmCloseTitle",
      defaultMessage: "Close editor?",
      description:
        "Title of the confirmation dialog when leaving an expanded writing block with pending AI edits.",
    }),
  });
  const heading = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.Ah, {
      title,
      subtitle: jsx.jsx(appShared.Lh, {
        children: jsx.jsx(appShared.Y2, {
          id: "codex.writingBlock.confirmClosePendingEdits",
          defaultMessage:
            "You have pending edits - are you sure you want to close?",
          description:
            "Confirmation before closing or replacing an expanded writing block with an in-progress or unresolved AI edit, matching ChatGPT.",
        }),
      }),
    }),
  });
  const cancelButton = jsx.jsx(appShared.Yh, {
    color: "outline",
    onClick: onCancel,
    type: "button",
    children: jsx.jsx(appShared.Y2, {
      id: "codex.writingBlock.confirmCloseCancel",
      defaultMessage: "Cancel",
      description:
        "Cancel leaving an expanded writing block with pending AI edits.",
    }),
  });
  const closeButton = jsx.jsx(appShared.Yh, {
    color: "primary",
    type: "submit",
    children: jsx.jsx(appShared.Y2, {
      id: "codex.writingBlock.confirmCloseConfirm",
      defaultMessage: "Close",
      description:
        "Confirm leaving an expanded writing block with pending AI edits.",
    }),
  });
  const footer = jsx.jsx(appShared.jh, {
    children: jsx.jsxs(appShared.kh, {
      children: [cancelButton, closeButton],
    }),
  });
  const form = jsx.jsxs(appShared.Oh, {
    as: "form",
    onSubmit: handleSubmit,
    children: [heading, footer],
  });

  return jsx.jsx(appShared.Ih, {
    open: true,
    onOpenChange: handleOpenChange,
    size: "compact",
    children: form,
  });
}

function initializePendingEditsDialog(): void {
  appShared.$3?.();
  appShared.K2?.();
  appShared.Zh?.();
  appShared.zh?.();
  appShared.Ph?.();
}

initializePendingEditsDialog();

export { initializePendingEditsDialog as n, PendingEditsDialog as t };
