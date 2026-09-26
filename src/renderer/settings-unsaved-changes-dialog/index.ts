// settings-unsaved-changes-dialog —— 离开设置前丢弃未保存更改的确认弹窗。
// 原版：app/webview/assets/settings-unsaved-changes-dialog-b754fcf540d8.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const jsx = appShared.I3();

function SettingsUnsavedChangesDialog({
  pendingNavigation,
  onClearPendingNavigation,
}: {
  pendingNavigation: (() => void) | null | undefined;
  onClearPendingNavigation: () => void;
}) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClearPendingNavigation();
  };
  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const navigate = pendingNavigation;
    onClearPendingNavigation();
    navigate?.();
  };
  const title = jsx.jsx(appShared.Rh, {
    children: jsx.jsx(appShared.Y2, {
      id: "settings.unsavedChanges.discardTitle",
      defaultMessage: "Discard changes?",
      description:
        "Title for the confirmation dialog shown before leaving Settings with unsaved changes",
    }),
  });
  const heading = jsx.jsx(appShared.jh, {
    children: jsx.jsx(appShared.Ah, {
      title,
      subtitle: jsx.jsx(appShared.Lh, {
        children: jsx.jsx(appShared.Y2, {
          id: "settings.unsavedChanges.discardDescription",
          defaultMessage:
            "You have unsaved changes. If you leave now, your changes will be lost.",
          description:
            "Description for the confirmation dialog shown before leaving Settings with unsaved changes",
        }),
      }),
    }),
  });
  const keepEditingButton = jsx.jsx(appShared.Yh, {
    color: "secondary",
    type: "button",
    onClick: onClearPendingNavigation,
    children: jsx.jsx(appShared.Y2, {
      id: "settings.unsavedChanges.keepEditing",
      defaultMessage: "Keep editing",
      description:
        "Button label for returning to Settings instead of discarding unsaved changes",
    }),
  });
  const discardButton = jsx.jsx(appShared.Yh, {
    color: "danger",
    type: "submit",
    children: jsx.jsx(appShared.Y2, {
      id: "settings.unsavedChanges.discard",
      defaultMessage: "Discard changes",
      description: "Button label for discarding unsaved Settings changes",
    }),
  });
  const footer = jsx.jsx(appShared.jh, {
    children: jsx.jsxs(appShared.kh, {
      children: [keepEditingButton, discardButton],
    }),
  });
  const form = jsx.jsxs(appShared.Oh, {
    as: "form",
    onSubmit: handleSubmit,
    children: [heading, footer],
  });

  return jsx.jsx(appShared.Ih, {
    open: pendingNavigation != null,
    showDialogClose: false,
    size: "compact",
    onOpenChange: handleOpenChange,
    children: form,
  });
}

function initializeSettingsUnsavedChangesDialog(): void {
  appShared.$3?.();
  appShared.K2?.();
  appShared.Zh?.();
  appShared.zh?.();
  appShared.Ph?.();
}

initializeSettingsUnsavedChangesDialog();

export {
  initializeSettingsUnsavedChangesDialog as n,
  SettingsUnsavedChangesDialog as t,
};
