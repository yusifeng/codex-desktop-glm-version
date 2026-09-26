// dialog-action —— 分享弹窗的保存、邀请与取消操作区。
// 原版：app/webview/assets/dialog-action-9fe7be84d34e.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import type { ButtonSize } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeReactRuntime,
  I3: getJsxRuntime,
  K2: initializeInternationalization,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
} = appSharedChunk;
const jsx = getJsxRuntime();

type DialogActionKind = "invite" | "share";

interface DialogPrimaryAction {
  label?: unknown;
  onClick: () => void;
  type?: "button" | "reset" | "submit";
}

interface DialogCancelAction {
  disabled?: boolean;
  onClick: () => void;
}

interface DialogActionProps {
  actions: Record<DialogActionKind, DialogPrimaryAction>;
  cancelAction?: DialogCancelAction;
  disabled?: boolean;
  hasPendingAccessChange: boolean;
  hasPendingInvitees: boolean;
  idleActions?: unknown;
  isSaving?: boolean;
  size?: ButtonSize;
}

function pendingAction({
  hasPendingAccessChange,
  hasPendingInvitees,
}: {
  hasPendingAccessChange: boolean;
  hasPendingInvitees: boolean;
}) {
  if (!hasPendingAccessChange && !hasPendingInvitees) return null;
  return hasPendingAccessChange && !hasPendingInvitees ? "share" : "invite";
}

function DefaultActionLabel({ action }: { action: DialogActionKind }) {
  switch (action) {
    case "invite":
      return jsx.jsx(FormattedMessage, {
        id: "shareDialog.primaryAction.invite",
        defaultMessage: "Invite",
        description:
          "Button label for inviting selected people or groups in a share dialog",
      });
    case "share":
      return jsx.jsx(FormattedMessage, {
        id: "shareDialog.primaryAction.save",
        defaultMessage: "Save",
        description: "Button label for saving a share dialog access change",
      });
  }
}

function DialogAction({
  actions,
  cancelAction,
  disabled,
  hasPendingAccessChange,
  hasPendingInvitees,
  idleActions,
  isSaving,
  size = "medium",
}: DialogActionProps) {
  const action = pendingAction({
    hasPendingAccessChange,
    hasPendingInvitees,
  });
  if (action == null) return idleActions ?? null;

  const cancelButton =
    cancelAction == null
      ? null
      : jsx.jsx(Button, {
          color: "secondary",
          disabled: (cancelAction.disabled ?? disabled) || isSaving,
          size,
          onClick: cancelAction.onClick,
          children: jsx.jsx(FormattedMessage, {
            id: "shareDialog.primaryAction.cancel",
            defaultMessage: "Cancel",
            description:
              "Button label for cancelling staged changes in a share dialog",
          }),
        });
  const actionConfig = actions[action];
  const label = isSaving
    ? jsx.jsx(FormattedMessage, {
        id: "shareDialog.primaryAction.saving",
        defaultMessage: "Saving",
        description:
          "Button label while a share dialog saves permissions or invites",
      })
    : (actionConfig.label ?? jsx.jsx(DefaultActionLabel, { action }));
  const primaryButton = jsx.jsx(Button, {
    "aria-busy": isSaving,
    color: "primary",
    disabled,
    loading: isSaving,
    size,
    onClick: actionConfig.onClick,
    type: actionConfig.type,
    children: label,
  });

  return jsx.jsxs("div", {
    className:
      "flex max-w-full shrink-0 flex-wrap items-center justify-end gap-3",
    children: [cancelButton, primaryButton],
  });
}

function initializeDialogAction(): void {
  initializeReactRuntime();
  initializeInternationalization();
  initializeButton();
}

export { initializeDialogAction as n, DialogAction as t };
