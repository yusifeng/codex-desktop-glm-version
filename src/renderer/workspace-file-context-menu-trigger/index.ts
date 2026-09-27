// workspace-file-context-menu-trigger —— 工作区文件的原生/网页上下文菜单触发器。
// 原版：app/webview/assets/workspace-file-context-menu-trigger-91e9150d0a73.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const {
  $3: initializeRuntimeLazy,
  Df: ContextMenu,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  LX: useSignalScope,
  Of: initializeContextMenu,
} = appSharedChunk;
const {
  $en: routeScope,
  Jut: getWorkspaceFileContextMenuItems,
  Yut: initializeWorkspaceFileContextMenuItems,
  itn: initializeWorkspaceFileRuntime,
} = appInitialChunk;

type WorkspaceFileContextMenuTriggerProps =
  import("@rchunk/app-initial").WorkspaceFileContextMenuOptions & {
    children: import("@rchunk/app-shared").MenuElement;
  };

let jsx: import("@rchunk/app-shared").JsxRuntime;

function WorkspaceFileContextMenuTrigger({
  children,
  ...options
}: WorkspaceFileContextMenuTriggerProps): unknown {
  const scope = useSignalScope(routeScope);
  return jsx.jsx(ContextMenu, {
    getItems: () => getWorkspaceFileContextMenuItems(scope, options),
    children,
  });
}

let initialized = false;
function initializeWorkspaceFileContextMenuTrigger(): void {
  if (initialized) return;
  initialized = true;
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeContextMenu();
  initializeWorkspaceFileRuntime();
  initializeWorkspaceFileContextMenuItems();
  jsx = getJsxRuntime();
}

initializeWorkspaceFileContextMenuTrigger();

export {
  initializeWorkspaceFileContextMenuTrigger as n,
  WorkspaceFileContextMenuTrigger as t,
};
