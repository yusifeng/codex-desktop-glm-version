import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/plugin-detail-page-core";
import "@rchunk/mcp-extension-view-page-core";

export interface McpExtensionView { entrypoint?: string; pluginId?: string; plugin_id?: string; serverName?: string; toolName?: string; tool_name?: string; url?: string; }
export interface PluginMcpAppDeepLinkPageProps { entrypoint?: string; pluginId?: string; toolName?: string; views?: readonly McpExtensionView[]; isLoading?: boolean; activationState?: "active" | "inactive" | "unavailable"; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
function basePluginId(value?: string): string | undefined { return value?.replace(/@(openai-bundled|openai-primary-runtime)$/, ""); }

function PluginMcpAppDeepLinkPage(props: PluginMcpAppDeepLinkPageProps): unknown {
  const runtime = ensureJsx();
  if (!props.pluginId || !props.toolName) return runtime.jsx("main", { role: "alert", children: "Extension view not found" });
  if (props.isLoading) return runtime.jsx("main", { "aria-busy": true, children: "Loading extension…" });
  const matches = (props.views ?? []).filter((view) => (view.entrypoint ?? "global") === (props.entrypoint ?? "global") && basePluginId(view.pluginId ?? view.plugin_id) === basePluginId(props.pluginId) && (view.toolName ?? view.tool_name) === props.toolName);
  if (matches.length === 1) return runtime.jsx("a", { "data-redirect": true, href: matches[0].url ?? `/plugins/${encodeURIComponent(props.pluginId)}/apps/${encodeURIComponent(props.toolName)}`, children: "Open app" });
  if (matches.length > 1) return runtime.jsx("main", { role: "status", "data-match-count": matches.length, children: "Choose an extension view" });
  return runtime.jsxs("main", { className: "plugin-deep-link-fallback", "data-activation-state": props.activationState ?? "inactive", children: [runtime.jsx("h1", { children: "Plugin app unavailable" }), runtime.jsx("p", { children: props.pluginId })] });
}

export { PluginMcpAppDeepLinkPage };
