// migrated-plugin-notice —— GPT 已迁移为插件后的打开按钮与权限状态展示。
// 原版：app/webview/assets/migrated-plugin-e6c50d3e1d93.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as chatChoiceChunk from "@rchunk/chat-choice-view";
import * as migratedAccessChunk from "@rchunk/migrated-plugin-access";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const chatChoice = chatChoiceChunk as Record<string, any>;
const migratedAccess = migratedAccessChunk as Record<string, any>;

let jsx: any;
let initialized = false;
function initializeMigratedPluginNotice(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.Ls?.();
  appShared.FX?.();
  appShared.K2?.();
  appInitial.Qgn?.();
  appShared.Zh?.();
  appShared.C_?.();
  appInitial.l1?.();
  chatChoice.n?.();
  migratedAccess.t?.();
  jsx = appShared.I3?.();
  initialized = true;
}

type Presentation = "notice" | "row";

function OpenPluginButton({
  onOpen,
  presentation = "notice",
}: {
  onOpen: () => void;
  presentation?: Presentation;
}): unknown {
  const isRow = presentation === "row";
  return jsx.jsxs(appShared.Yh, {
    className: "w-full",
    color: isRow ? "outlineGhost" : "primary",
    size: isRow ? "entityRowAction" : "beaconAction",
    type: "button",
    onClick: onOpen,
    children: [
      jsx.jsx(appShared.Y2, {
        id: "chatgptConversations.gpts.migration.openPlugin",
        defaultMessage: "Open plugin",
        description:
          "Button in a migrated GPT notice or migration success dialog that opens the destination plugin's detail page; it does not install or run the plugin",
      }),
      jsx.jsx(appShared.S_, {
        asset: appShared.Is,
        className: "shrink-0",
      }),
    ],
  });
}

function MigratedPluginAccessPresentation({
  accessState,
  gptName,
  presentation = "notice",
  onOpen,
  onRetry,
  onExplore,
}: {
  accessState: string;
  gptName?: string;
  presentation?: Presentation;
  onOpen: () => void;
  onRetry: () => void;
  onExplore: () => void;
}): unknown {
  if (gptName != null)
    return jsx.jsx(chatChoice.t, {
      accessState,
      gptName,
      onRetry,
      onUsePlugin: accessState === "allowed" ? onOpen : onExplore,
    });
  return jsx.jsx(OpenPluginButton, { onOpen, presentation });
}

function AccessCheckedMigratedPlugin({
  pluginId,
  gptName,
  onClose,
}: {
  pluginId: string;
  gptName: string;
  onClose?: () => void;
}): unknown {
  const navigate = appInitial.o_n?.() ?? (() => {});
  const query = appShared.BX?.(migratedAccess.n, pluginId) ?? {};
  let accessState = "denied";
  if (query.isPending || query.isFetching) accessState = "pending";
  else if (query.isError) accessState = "error";
  else if (query.data === true) accessState = "allowed";
  const onOpen = () => {
    onClose?.();
    appInitial.u1?.(pluginId, navigate);
  };
  const onRetry = () => void query.refetch?.();
  const onExplore = () => {
    onClose?.();
    navigate("/plugins");
  };
  return jsx.jsx(MigratedPluginAccessPresentation, {
    accessState,
    gptName,
    onOpen,
    onRetry,
    onExplore,
  });
}

function MigratedPluginNotice({
  pluginId,
  onClose,
  gptName,
  presentation = "notice",
}: {
  pluginId: string;
  onClose?: () => void;
  gptName?: string;
  presentation?: Presentation;
}): unknown {
  initializeMigratedPluginNotice();
  const navigate = appInitial.o_n?.() ?? (() => {});
  if (gptName != null)
    return jsx.jsx(AccessCheckedMigratedPlugin, {
      pluginId,
      gptName,
      onClose,
    });
  const onOpen = () => {
    onClose?.();
    appInitial.u1?.(pluginId, navigate);
  };
  return jsx.jsx(OpenPluginButton, { presentation, onOpen });
}

initializeMigratedPluginNotice();
export {
  OpenPluginButton as n,
  initializeMigratedPluginNotice as r,
  MigratedPluginNotice as t,
};
