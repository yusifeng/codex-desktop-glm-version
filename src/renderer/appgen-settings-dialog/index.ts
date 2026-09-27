// appgen-settings-dialog —— Site 项目设置页的宽屏弹窗宿主。
// 原版：app/webview/assets/appgen-settings-dialog-22832d8eda26.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appgenSettingsPageChunk from "@rchunk/appgen-settings-page";

void runtimeChunk;
const {
  $3: initializeRuntimeLazy,
  Ah: DialogHeader,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeSharedComponents,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  n4: useIntl,
  zh: initializeDialog,
} = appSharedChunk;
const { r: initializeAppgenSettingsPage, t: AppgenSettingsPage } =
  appgenSettingsPageChunk;
const jsx = getJsxRuntime();

interface AppgenSettingsDialogProps {
  onClose(): void;
  projectId: string;
}

function AppgenSettingsDialog({
  onClose,
  projectId,
}: AppgenSettingsDialogProps): unknown {
  const intl = useIntl();
  const title = jsx.jsx(FormattedMessage, {
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
      jsx.jsx(DialogTitle, { className: "sr-only", children: title }),
      jsx.jsx(DialogHeader, {
        title,
        titleClassName: "truncate pe-8",
      }),
    ],
  });
  const content = jsx.jsxs(DialogBody, {
    className: "!px-1 !py-1",
    size: "full",
    children: [
      heading,
      jsx.jsx(AppgenSettingsPage, { projectId, onDeleted: onClose }),
    ],
  });

  return jsx.jsx(Dialog, {
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
  initializeRuntimeLazy();
  initializeSharedComponents();
  initializeDialog();
  initializeDialogLayout();
  initializeAppgenSettingsPage();
}

initializeAppgenSettingsDialog();

export { AppgenSettingsDialog };
