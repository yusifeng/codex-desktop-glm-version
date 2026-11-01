// workspace-file-context-menu-trigger —— 工作区文件的原生/网页上下文菜单触发器。
// 原版：app/webview/assets/workspace-file-context-menu-trigger-91e9150d0a73.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const {
  $3: getCompilerRuntime,
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

type WorkspaceFileContextMenuOptions =
  import("@rchunk/app-initial").WorkspaceFileContextMenuOptions;
type WorkspaceFileContextMenuTriggerProps = WorkspaceFileContextMenuOptions & {
    children: import("@rchunk/app-shared").MenuElement;
  };

let jsx: import("@rchunk/app-shared").JsxRuntime;
interface CompilerRuntime {
  c(size: number): unknown[];
}
let compilerRuntime: CompilerRuntime;

function WorkspaceFileContextMenuTrigger(
  props: WorkspaceFileContextMenuTriggerProps,
): unknown {
  const cache = compilerRuntime.c(9);
  let children: WorkspaceFileContextMenuTriggerProps["children"];
  let options: WorkspaceFileContextMenuOptions;
  if (cache[0] !== props) {
    ({ children, ...options } = props);
    cache[0] = props;
    cache[1] = children;
    cache[2] = options;
  } else {
    children = cache[1] as typeof children;
    options = cache[2] as typeof options;
  }
  const scope = useSignalScope(routeScope);
  let getItems: () => unknown;
  if (cache[3] !== options || cache[4] !== scope) {
    getItems = () => getWorkspaceFileContextMenuItems(scope, options);
    cache[3] = options;
    cache[4] = scope;
    cache[5] = getItems;
  } else {
    getItems = cache[5] as () => unknown;
  }

  if (cache[6] !== children || cache[7] !== getItems) {
    cache[6] = children;
    cache[7] = getItems;
    cache[8] = jsx.jsx(ContextMenu, { getItems, children });
  }
  return cache[8];
}

let initialized = false;
function initializeWorkspaceFileContextMenuTrigger(): void {
  if (initialized) return;
  initialized = true;
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
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
