import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/use-search-plugins";
import "@rchunk/plugin-detail-page-core";
import { t as PluginDetailView } from "@rchunk/plugin-detail-view";

export interface ProfilePluginDetailsProps { invocation: { plugin_id?: string | null; plugin_name: string }; onClose(): void; onCloseAutoFocus?(): void; plugin?: { id?: string; name: string; [key: string]: unknown } | null; searchResults?: Array<{ installedPlugin?: { id?: string; name: string; [key: string]: unknown }; name: string; pluginId?: string; remoteMarketplaceName?: string; remotePluginId?: string; scope?: string }>; searchError?: Error | null; searchLoading?: boolean }
let jsx: JsxRuntime;
function ProfilePluginDetails(props: ProfilePluginDetailsProps): unknown {
  const runtime = ensureJsx();
  const [name = "", source] = props.invocation.plugin_id?.split("@") ?? [];
  const scope = source === "openai-curated-remote" ? "GLOBAL" : source === "workspace-directory" ? "WORKSPACE" : source === "created-by-me-remote" ? "USER" : undefined;
  const found = props.searchResults?.find((item) => item.pluginId === props.invocation.plugin_id || item.remotePluginId === props.invocation.plugin_id || (scope != null && item.scope === scope && item.name === name));
  const plugin = props.plugin ?? found?.installedPlugin;
  const body = plugin != null
    ? runtime.jsx("article", { "data-plugin-id": plugin.id, children: runtime.jsx("h1", { children: plugin.name }) })
    : props.searchLoading ? runtime.jsx(PluginDetailView, { state: "loading" })
      : props.searchError != null ? runtime.jsx(PluginDetailView, { state: "error", errorMessage: props.searchError.message })
        : runtime.jsx(PluginDetailView, { state: "missing" });
  return runtime.jsxs("dialog", { open: true, onClose: props.onClose, children: [runtime.jsx("span", { className: "sr-only", children: props.invocation.plugin_name }), body] });
}
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { ProfilePluginDetails };
