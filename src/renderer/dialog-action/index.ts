// dialog-action —— 分享弹窗的保存、邀请与取消操作区。
// 原版：app/webview/assets/dialog-action-9fe7be84d34e.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const jsx = appShared.I3();

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

function DefaultActionLabel({ action }: { action: "invite" | "share" }) {
  switch (action) {
    case "invite":
      return jsx.jsx(appShared.Y2, {
        id: "shareDialog.primaryAction.invite",
        defaultMessage: "Invite",
        description:
          "Button label for inviting selected people or groups in a share dialog",
      });
    case "share":
      return jsx.jsx(appShared.Y2, {
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
}: {
  actions: Record<string, any>;
  cancelAction?: { disabled?: boolean; onClick: () => void };
  disabled?: boolean;
  hasPendingAccessChange: boolean;
  hasPendingInvitees: boolean;
  idleActions?: any;
  isSaving?: boolean;
  size?: string;
}) {
  const action = pendingAction({
    hasPendingAccessChange,
    hasPendingInvitees,
  });
  if (action == null) return idleActions ?? null;

  const cancelButton =
    cancelAction == null
      ? null
      : jsx.jsx(appShared.Yh, {
          color: "secondary",
          disabled: (cancelAction.disabled ?? disabled) || isSaving,
          size,
          onClick: cancelAction.onClick,
          children: jsx.jsx(appShared.Y2, {
            id: "shareDialog.primaryAction.cancel",
            defaultMessage: "Cancel",
            description:
              "Button label for cancelling staged changes in a share dialog",
          }),
        });
  const actionConfig = actions[action];
  const label = isSaving
    ? jsx.jsx(appShared.Y2, {
        id: "shareDialog.primaryAction.saving",
        defaultMessage: "Saving",
        description:
          "Button label while a share dialog saves permissions or invites",
      })
    : (actionConfig.label ?? jsx.jsx(DefaultActionLabel, { action }));
  const primaryButton = jsx.jsx(appShared.Yh, {
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
  appShared.$3?.();
  appShared.K2?.();
  appShared.Zh?.();
}

export { initializeDialogAction as n, DialogAction as t };
