import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import "@rchunk/view-frame";
import type { JsxRuntime } from "@rchunk/app-shared";
const { I3: jsxExport } = appSharedChunk as unknown as { I3: JsxRuntime | (() => JsxRuntime) };
let jsx: JsxRuntime;
interface Props { action?: { name?: string }; pending?: boolean; quickActionView?: unknown; onOpen?(open: boolean): void; trigger?: unknown; tooltipText?: string; view?: unknown; }
function McpQuickActionDialog({ action, pending = false, quickActionView, onOpen, trigger, tooltipText, view }: Props): unknown { initializeMcpQuickActionDialog(); return jsx.jsxs("div", { className: "mcp-quick-action", children: [jsx.jsx("button", { disabled: pending, onClick: () => onOpen?.(true), title: tooltipText, type: "button", children: trigger ?? action?.name ?? "Open app" }), jsx.jsx("section", { "aria-busy": pending, children: quickActionView ?? view })] }); }
function initializeMcpQuickActionDialog(): void { if (jsx == null) jsx = typeof jsxExport === "function" ? jsxExport() : jsxExport; }
initializeMcpQuickActionDialog();
export { initializeMcpQuickActionDialog as n, McpQuickActionDialog as t };
