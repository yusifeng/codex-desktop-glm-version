// location-permission-denied-dialog —— 浏览器精确位置权限被拒绝后的恢复指引。
// 原版：app/webview/assets/permission-denied-dialog-d97cccd05f4a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeJsxRuntime,
  Ah: DialogHeader,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeFormattedMessage,
  Lh: DialogDescription,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  jh: DialogSection,
  zh: initializeDialog,
} = appSharedChunk;

const jsx = getJsxRuntime();

interface LocationPermissionDeniedDialogProps {
  onClose(): void;
}

function ChatGptLocationPermissionDeniedDialog({
  onClose,
}: LocationPermissionDeniedDialogProps): unknown {
  const title = jsx.jsx(DialogTitle, {
    children: jsx.jsx(FormattedMessage, {
      id: "chatgptConversations.preciseLocation.permissionDenied.title",
      defaultMessage: "Turn on location access",
      description:
        "Title of a dialog shown after ChatGPT cannot get precise location because browser permission was already blocked. It asks the user to enable this site's Location permission in their browser. Keep this headline concise.",
    }),
  });
  const content = jsx.jsx(DialogBody, {
    children: jsx.jsx(DialogSection, {
      children: jsx.jsx(DialogHeader, {
        className: "select-none",
        title,
        subtitle: jsx.jsx(DialogDescription, {
          children: jsx.jsx(FormattedMessage, {
            id: "chatgptConversations.preciseLocation.permissionDenied.description",
            defaultMessage:
              "Open your browser's site settings from the icon beside the address bar, set Location to Allow, then refresh the page",
            description:
              "Instructions in a ChatGPT dialog shown when browser location permission was already blocked. Explain how to enable this site's Location permission using the browser's site-controls icon, then reload ChatGPT. This is plain text with no interactive link or placeholders.",
          }),
        }),
      }),
    }),
  });
  return jsx.jsx(Dialog, {
    open: true,
    size: "compact",
    onOpenChange: (open: boolean) => {
      if (!open) onClose();
    },
    children: content,
  });
}

function initializeLocationPermissionDeniedDialog(): void {
  initializeJsxRuntime();
  initializeFormattedMessage();
  initializeDialog();
  initializeDialogLayout();
}

initializeLocationPermissionDeniedDialog();

export { ChatGptLocationPermissionDeniedDialog };
