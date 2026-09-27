// settings-unsaved-changes-dialog —— 离开设置前丢弃未保存更改的确认弹窗。
// 原版：app/webview/assets/settings-unsaved-changes-dialog-b754fcf540d8.js。

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

interface SettingsUnsavedChangesDialogProps {
  pendingNavigation?: (() => void) | null;
  onClearPendingNavigation(): void;
}

interface FormSubmitEvent {
  preventDefault(): void;
}

function SettingsUnsavedChangesDialog({
  pendingNavigation,
  onClearPendingNavigation,
}: SettingsUnsavedChangesDialogProps): unknown {
  const jsx = getInitializedJsxRuntime();
  const handleOpenChange = (open: boolean) => {
    if (!open) onClearPendingNavigation();
  };
  const handleSubmit = (event: FormSubmitEvent) => {
    event.preventDefault();
    const navigate = pendingNavigation;
    onClearPendingNavigation();
    navigate?.();
  };
  const title = jsx.jsx(DialogTitle, {
    children: jsx.jsx(FormattedMessage, {
      id: "settings.unsavedChanges.discardTitle",
      defaultMessage: "Discard changes?",
      description:
        "Title for the confirmation dialog shown before leaving Settings with unsaved changes",
    }),
  });
  const heading = jsx.jsx(DialogSection, {
    children: jsx.jsx(DialogHeader, {
      title,
      subtitle: jsx.jsx(DialogDescription, {
        children: jsx.jsx(FormattedMessage, {
          id: "settings.unsavedChanges.discardDescription",
          defaultMessage:
            "You have unsaved changes. If you leave now, your changes will be lost.",
          description:
            "Description for the confirmation dialog shown before leaving Settings with unsaved changes",
        }),
      }),
    }),
  });
  const keepEditingButton = jsx.jsx(Button, {
    color: "secondary",
    type: "button",
    onClick: onClearPendingNavigation,
    children: jsx.jsx(FormattedMessage, {
      id: "settings.unsavedChanges.keepEditing",
      defaultMessage: "Keep editing",
      description:
        "Button label for returning to Settings instead of discarding unsaved changes",
    }),
  });
  const discardButton = jsx.jsx(Button, {
    color: "danger",
    type: "submit",
    children: jsx.jsx(FormattedMessage, {
      id: "settings.unsavedChanges.discard",
      defaultMessage: "Discard changes",
      description: "Button label for discarding unsaved Settings changes",
    }),
  });
  const footer = jsx.jsx(DialogSection, {
    children: jsx.jsxs(DialogFooter, {
      children: [keepEditingButton, discardButton],
    }),
  });
  const form = jsx.jsxs(DialogBody, {
    as: "form",
    onSubmit: handleSubmit,
    children: [heading, footer],
  });

  return jsx.jsx(Dialog, {
    open: pendingNavigation != null,
    showDialogClose: false,
    size: "compact",
    onOpenChange: handleOpenChange,
    children: form,
  });
}

function initializeSettingsUnsavedChangesDialog(): void {
  if (jsxRuntime != null) return;
  initializeJsxRuntime();
  initializeIntlRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  jsxRuntime = getJsxRuntime();
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeSettingsUnsavedChangesDialog();
  if (jsxRuntime == null) {
    throw new Error("Unsaved settings dialog JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

initializeSettingsUnsavedChangesDialog();

export {
  initializeSettingsUnsavedChangesDialog as n,
  SettingsUnsavedChangesDialog as t,
};
