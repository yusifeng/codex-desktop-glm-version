// automation-delete-confirmation-dialog —— 永久删除计划任务的确认对话框。
// 原版：app/webview/assets/automation-delete-confirmation-dialog-65dd08412175.js。

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
let initialized = false;

function initializeAutomationDeleteConfirmationDialog(): void {
  if (initialized) return;
  initializeJsxRuntime();
  initializeIntlRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  jsxRuntime = getJsxRuntime();
  initialized = true;
}

interface AutomationDeleteConfirmationDialogProps {
  isPending: boolean;
  name: string;
  onCancel(): void;
  onConfirm(): void;
  open: boolean;
}

interface FormSubmitEvent {
  preventDefault(): void;
}

function AutomationDeleteConfirmationDialog({
  isPending,
  name,
  onCancel,
  onConfirm,
  open,
}: AutomationDeleteConfirmationDialogProps): unknown {
  initializeAutomationDeleteConfirmationDialog();
  const jsx = getInitializedJsxRuntime();
  const title = jsx.jsx(DialogTitle, {
    children: jsx.jsx(FormattedMessage, {
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
  const subtitle = jsx.jsx(DialogDescription, {
    children: jsx.jsx(FormattedMessage, {
      id: "inbox.automations.deleteConfirm.descriptionNoPeriod",
      defaultMessage:
        "This will permanently delete the scheduled task and stop future runs",
      description:
        "Description for the delete scheduled task confirmation dialog",
    }),
  });
  const header = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogHeader, { title, subtitle }),
  });
  const cancel = jsx.jsx(Button, {
    color: "outline",
    onClick: onCancel,
    children: jsx.jsx(FormattedMessage, {
      id: "inbox.automations.deleteConfirm.cancel",
      defaultMessage: "Cancel",
      description:
        "Cancel button label for delete automation confirmation dialog",
    }),
  });
  const confirm = jsx.jsx(Button, {
    color: "danger",
    loading: isPending,
    type: "submit",
    children: jsx.jsx(FormattedMessage, {
      id: "inbox.automations.deleteConfirm.confirm",
      defaultMessage: "Delete scheduled task",
      description:
        "Confirm button label for delete scheduled task confirmation dialog",
    }),
  });
  const footer = jsx.jsx(DialogSection, {
    children: jsx.jsxs(DialogFooter, { children: [cancel, confirm] }),
  });
  const content = jsx.jsxs(DialogBody, {
    as: "form",
    onSubmit: (event: FormSubmitEvent) => {
      event.preventDefault();
      onConfirm();
    },
    children: [header, footer],
  });
  return jsx.jsx(Dialog, {
    open,
    onOpenChange: (nextOpen: boolean) => {
      if (!nextOpen) onCancel();
    },
    children: content,
  });
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeAutomationDeleteConfirmationDialog();
  if (jsxRuntime == null) {
    throw new Error("Automation delete dialog JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

initializeAutomationDeleteConfirmationDialog();
export {
  initializeAutomationDeleteConfirmationDialog as n,
  AutomationDeleteConfirmationDialog as t,
};
