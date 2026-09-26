// location-permission-denied-dialog —— 浏览器精确位置权限被拒绝后的恢复指引。
// 原版：app/webview/assets/permission-denied-dialog-d97cccd05f4a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;

const jsx = appShared.I3();

function ChatGptLocationPermissionDeniedDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const title = jsx.jsx(appShared.Rh, {
    children: jsx.jsx(appShared.Y2, {
      id: "chatgptConversations.preciseLocation.permissionDenied.title",
      defaultMessage: "Turn on location access",
      description:
        "Title of a dialog shown after precise location permission was blocked",
    }),
  });
  const content = jsx.jsx(appShared.Oh, {
    children: jsx.jsx(appShared.jh, {
      children: jsx.jsx(appShared.Ah, {
        className: "select-none",
        title,
        subtitle: jsx.jsx(appShared.Lh, {
          children: jsx.jsx(appShared.Y2, {
            id: "chatgptConversations.preciseLocation.permissionDenied.description",
            defaultMessage:
              "Open your browser's site settings from the icon beside the address bar, set Location to Allow, then refresh the page",
            description:
              "Instructions for enabling the site's Location permission and refreshing",
          }),
        }),
      }),
    }),
  });
  return jsx.jsx(appShared.Ih, {
    open: true,
    size: "compact",
    onOpenChange: (open: boolean) => {
      if (!open) onClose();
    },
    children: content,
  });
}

function initializeLocationPermissionDeniedDialog(): void {
  appShared.$3?.();
  appShared.K2?.();
  appShared.zh?.();
  appShared.Ph?.();
}

initializeLocationPermissionDeniedDialog();

export { ChatGptLocationPermissionDeniedDialog };
