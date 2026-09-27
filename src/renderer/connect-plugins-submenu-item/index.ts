import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import type { JsxRuntime } from "@rchunk/app-shared";
const { I3: jsxExport } = appSharedChunk as unknown as { I3: JsxRuntime | (() => JsxRuntime) };
let jsx: JsxRuntime;
export interface ConnectPluginsSubmenuItemProps { connectedCount?: number; disabled?: boolean; onConnect(): void; }
function ConnectPluginsSubmenuItem({ connectedCount = 0, disabled = false, onConnect }: ConnectPluginsSubmenuItemProps): unknown {
  initializeConnectPluginsSubmenuItem();
  return jsx.jsx("button", { disabled, onClick: onConnect, role: "menuitem", type: "button", children: connectedCount > 0 ? `Connect plugins (${connectedCount})` : "Connect plugins" });
}
function initializeConnectPluginsSubmenuItem(): void { if (jsx == null) jsx = typeof jsxExport === "function" ? jsxExport() : jsxExport; }
initializeConnectPluginsSubmenuItem();
export { initializeConnectPluginsSubmenuItem as n, ConnectPluginsSubmenuItem as t };
