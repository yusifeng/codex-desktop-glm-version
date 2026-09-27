import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import "@rchunk/ecosystem-widget-queries";
import type { JsxRuntime } from "@rchunk/app-shared";
const { I3: jsxExport } = appSharedChunk as unknown as { I3: JsxRuntime | (() => JsxRuntime) };
let jsx: JsxRuntime;
interface Props { connectorName?: string; onClose?(): void; onContinue?(): void; open?: boolean; }
function ConnectorPostConnectDialog({ connectorName = "Connector", onClose, onContinue, open = true }: Props): unknown { if (!open) return null; if (jsx == null) jsx = typeof jsxExport === "function" ? jsxExport() : jsxExport; return jsx.jsxs("section", { role: "dialog", "aria-label": `${connectorName} connected`, children: [jsx.jsx("h2", { children: `${connectorName} connected` }), jsx.jsx("p", { children: "You can now use this connector in ChatGPT." }), jsx.jsx("button", { onClick: onContinue, type: "button", children: "Continue" }), jsx.jsx("button", { onClick: onClose, type: "button", children: "Close" })] }); }
export { ConnectorPostConnectDialog };
