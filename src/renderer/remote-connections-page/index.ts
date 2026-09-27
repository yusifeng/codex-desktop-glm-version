// remote-connections-page —— 旧远程连接入口到当前设置页的兼容重定向。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
void runtimeChunk;

const { $3: initializeRuntimeLazy, I3: getJsxRuntime } = appSharedChunk;
const {
  C4: initializeWorkModeAccess,
  E4: hasWorkModeAccess,
  Qgn: initializeAccountContext,
  Ygn: Navigate,
} = appInitialChunk;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function RemoteConnectionsPage(): unknown {
  return jsx.jsx(Navigate, {
    to: hasWorkModeAccess() ? "/settings/connections" : "/",
    replace: true,
  });
}

function initializeRemoteConnectionsPage(): void {
  initializeRuntimeLazy();
  initializeAccountContext();
  initializeWorkModeAccess();
  jsx = getJsxRuntime();
}

initializeRemoteConnectionsPage();
export { RemoteConnectionsPage };
