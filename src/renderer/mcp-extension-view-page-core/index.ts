import "@rchunk/rolldown-runtime";
import "@rchunk/mcp-view-surface";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";
import { n as initializeViewFrame, t as ViewFrame } from "@rchunk/view-frame";
import { n as initializeQuickActionDialog } from "@rchunk/mcp-quick-action-dialog";

interface McpView { entrypoint?: { type?: string }; id?: string; title?: string; [key: string]: unknown }
interface McpExtensionViewPageProps { deepLink?: string; locationState?: unknown; mcpAppId?: string; path?: string; view?: McpView | null; views?: McpView[] }
const jsx = getJsxRuntime();
function McpViewNotFound(): unknown { return jsx.jsxs("div", { className: "flex h-full min-h-0 items-center justify-center", children: [jsx.jsx("h1", { children: "MCP app view not found" }), jsx.jsx("p", { children: "The requested app view is unavailable." })] }); }
function McpExtensionViewPage({ deepLink, mcpAppId, path, view, views = [] }: McpExtensionViewPageProps = {}): unknown {
  const selected = view ?? views.find(item => item.id === path) ?? null;
  if (selected == null) return jsx.jsx(McpViewNotFound, {});
  const id = mcpAppId ?? `mcp-${selected.id ?? "view"}`;
  return jsx.jsxs("main", { "data-mcp-app-id": id, children: [jsx.jsx("h1", { className: "sr-only", children: selected.title ?? "MCP app" }), jsx.jsx(ViewFrame, { deepLink, lifetime: selected.entrypoint?.type === "settings" ? "component" : "app", mcpAppId: id, view: selected })] });
}
function initializeMcpViewPageRuntime(): void { initializeApiClient(); initializeViewFrame(); initializeQuickActionDialog(); }
function initializeMcpExtensionViewPage(): void { initializeMcpViewPageRuntime(); }
export { initializeMcpViewPageRuntime as i, initializeMcpExtensionViewPage as n, McpViewNotFound as r, McpExtensionViewPage as t };
