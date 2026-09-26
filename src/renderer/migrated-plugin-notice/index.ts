// migrated-plugin-notice —— GPT 已迁移为插件后的打开按钮与权限状态展示。
// 原版：app/webview/assets/migrated-plugin-e6c50d3e1d93.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as chatChoiceChunk from "@rchunk/chat-choice-view";
import * as migratedAccessChunk from "@rchunk/migrated-plugin-access";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;

export type MigratedPluginPresentation = "notice" | "row";

export interface MigratedPluginNoticeProps {
  gptName?: string;
  onClose?: () => void;
  pluginId: string;
  presentation?: MigratedPluginPresentation;
}

const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValue,
  C_: initializeIconAsset,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  Is: openPluginIcon,
  K2: initializeReactRuntime,
  Ls: initializeOpenPluginIcon,
  S_: IconAsset,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
} = appSharedChunk;
const {
  Qgn: initializeGptResources,
  l1: initializePluginNavigation,
  o_n: useNavigate,
  u1: openPlugin,
} = appInitialChunk;
const {
  n: initializeChatChoiceView,
  t: ChatChoiceView,
} = chatChoiceChunk;
const {
  n: migratedPluginAccessQuery,
  t: initializeMigratedPluginAccess,
} = migratedAccessChunk;

let jsx: JsxRuntime;
let initialized = false;
function initializeMigratedPluginNotice(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeOpenPluginIcon();
  initializeSignalRuntime();
  initializeReactRuntime();
  initializeGptResources();
  initializeButton();
  initializeIconAsset();
  initializePluginNavigation();
  initializeChatChoiceView();
  initializeMigratedPluginAccess();
  jsx = getJsxRuntime();
  initialized = true;
}

function OpenPluginButton({
  onOpen,
  presentation = "notice",
}: {
  onOpen: () => void;
  presentation?: MigratedPluginPresentation;
}): unknown {
  const isRow = presentation === "row";
  return jsx.jsxs(Button, {
    className: "w-full",
    color: isRow ? "outlineGhost" : "primary",
    size: isRow ? "entityRowAction" : "beaconAction",
    type: "button",
    onClick: onOpen,
    children: [
      jsx.jsx(FormattedMessage, {
        id: "chatgptConversations.gpts.migration.openPlugin",
        defaultMessage: "Open plugin",
        description:
          "Button in a migrated GPT notice or migration success dialog that opens the destination plugin's detail page; it does not install or run the plugin",
      }),
      jsx.jsx(IconAsset, {
        asset: openPluginIcon,
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
  presentation?: MigratedPluginPresentation;
  onOpen: () => void;
  onRetry: () => void;
  onExplore: () => void;
}): unknown {
  if (gptName != null)
    return jsx.jsx(ChatChoiceView, {
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
  const navigate = useNavigate();
  const query = useSignalFamilyValue(migratedPluginAccessQuery, pluginId);
  let accessState: "allowed" | "denied" | "error" | "pending" = "denied";
  if (query.isPending || query.isFetching) accessState = "pending";
  else if (query.isError) accessState = "error";
  else if (query.data === true) accessState = "allowed";
  const onOpen = () => {
    onClose?.();
    openPlugin(pluginId, navigate);
  };
  const onRetry = () => void query.refetch();
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
}: MigratedPluginNoticeProps): unknown {
  initializeMigratedPluginNotice();
  const navigate = useNavigate();
  if (gptName != null)
    return jsx.jsx(AccessCheckedMigratedPlugin, {
      pluginId,
      gptName,
      onClose,
    });
  const onOpen = () => {
    onClose?.();
    openPlugin(pluginId, navigate);
  };
  return jsx.jsx(OpenPluginButton, { presentation, onOpen });
}

initializeMigratedPluginNotice();
export {
  OpenPluginButton as n,
  initializeMigratedPluginNotice as r,
  MigratedPluginNotice as t,
};
