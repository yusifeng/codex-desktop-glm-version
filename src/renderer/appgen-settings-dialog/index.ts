// appgen-settings-dialog —— Site 项目设置页的宽屏弹窗宿主。
// 原版：app/webview/assets/appgen-settings-dialog-22832d8eda26.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appgenSettingsPageChunk from "@rchunk/appgen-settings-page";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appgenSettingsPage = appgenSettingsPageChunk as Record<string, any>;
const jsx = appShared.I3();

function AppgenSettingsDialog({
  onClose,
  projectId,
}: {
  onClose: () => void;
  projectId: string;
}) {
  const intl = appShared.n4();
  const title = jsx.jsx(appShared.Y2, {
    id: "appgenSettings.dialog.title",
    defaultMessage: "Site settings",
    description: "Title for the Site settings dialog",
  });
  const dialogCloseLabel = intl.formatMessage({
    id: "appgenSettings.dialog.close",
    defaultMessage: "Close Site settings",
    description: "Accessible label for closing the Site settings dialog",
  });
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  const heading = jsx.jsxs("div", {
    className: "flex w-full flex-col px-4 pt-3",
    children: [
      jsx.jsx(appShared.Rh, { className: "sr-only", children: title }),
      jsx.jsx(appShared.Ah, {
        title,
        titleClassName: "truncate pe-8",
      }),
    ],
  });
  const content = jsx.jsxs(appShared.Oh, {
    className: "!px-1 !py-1",
    size: "full",
    children: [
      heading,
      jsx.jsx(appgenSettingsPage.t, { projectId, onDeleted: onClose }),
    ],
  });

  return jsx.jsx(appShared.Ih, {
    open: true,
    contentClassName: "h-[720px] max-h-[92vh]",
    contentProps: { "aria-describedby": undefined },
    dialogCloseLabel,
    size: "xwide",
    onOpenChange: handleOpenChange,
    children: content,
  });
}

function initializeAppgenSettingsDialog(): void {
  appShared.$3?.();
  appShared.K2?.();
  appShared.zh?.();
  appShared.Ph?.();
  appgenSettingsPage.r?.();
}

initializeAppgenSettingsDialog();

export { AppgenSettingsDialog };
