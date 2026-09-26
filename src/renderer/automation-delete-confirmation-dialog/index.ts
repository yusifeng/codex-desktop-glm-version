// automation-delete-confirmation-dialog —— 永久删除计划任务的确认对话框。
// 原版：app/webview/assets/automation-delete-confirmation-dialog-65dd08412175.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
let jsx: any;
let initialized = false;

function initializeAutomationDeleteConfirmationDialog(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.K2?.();
  appShared.Zh?.();
  appShared.zh?.();
  appShared.Ph?.();
  jsx = appShared.I3?.();
  initialized = true;
}

function AutomationDeleteConfirmationDialog({
  isPending,
  name,
  onCancel,
  onConfirm,
  open,
}: {
  isPending: boolean;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}): unknown {
  initializeAutomationDeleteConfirmationDialog();
  const title = jsx.jsx(appShared.Rh, {
    children: jsx.jsx(appShared.Y2, {
      id: "inbox.automations.deleteConfirm.title",
      defaultMessage: "Delete {name}?",
      description: "Title for the delete automation confirmation dialog",
      values: {
        name: jsx.jsx("strong", {
          className: "font-semibold text-default",
          children: name,
        }),
      },
    }),
  });
  const subtitle = jsx.jsx(appShared.Lh, {
    children: jsx.jsx(appShared.Y2, {
      id: "inbox.automations.deleteConfirm.descriptionNoPeriod",
      defaultMessage:
        "This will permanently delete the scheduled task and stop future runs",
      description:
        "Description for the delete scheduled task confirmation dialog",
    }),
  });
  const header = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.Ah, { title, subtitle }),
  });
  const cancel = jsx.jsx(appShared.Yh, {
    color: "outline",
    onClick: onCancel,
    children: jsx.jsx(appShared.Y2, {
      id: "inbox.automations.deleteConfirm.cancel",
      defaultMessage: "Cancel",
      description:
        "Cancel button label for delete automation confirmation dialog",
    }),
  });
  const confirm = jsx.jsx(appShared.Yh, {
    color: "danger",
    loading: isPending,
    type: "submit",
    children: jsx.jsx(appShared.Y2, {
      id: "inbox.automations.deleteConfirm.confirm",
      defaultMessage: "Delete scheduled task",
      description:
        "Confirm button label for delete scheduled task confirmation dialog",
    }),
  });
  const footer = jsx.jsx(appShared.jh, {
    children: jsx.jsxs(appShared.kh, { children: [cancel, confirm] }),
  });
  const content = jsx.jsxs(appShared.Oh, {
    as: "form",
    onSubmit: (event: any) => {
      event.preventDefault();
      onConfirm();
    },
    children: [header, footer],
  });
  return jsx.jsx(appShared.Ih, {
    open,
    onOpenChange: (nextOpen: boolean) => {
      if (!nextOpen) onCancel();
    },
    children: content,
  });
}

initializeAutomationDeleteConfirmationDialog();
export {
  initializeAutomationDeleteConfirmationDialog as n,
  AutomationDeleteConfirmationDialog as t,
};
