import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/plugin-detail-view";

export interface BrowserPluginSharePageProps { shareKey?: string; resolvedPluginId?: string; isLoading?: boolean; error?: string; search?: string; }
const BUNDLED_SHARE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*@(?:openai-bundled|openai-primary-runtime)$/;
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function BrowserPluginSharePage(props: BrowserPluginSharePageProps): unknown {
  const runtime = ensureJsx();
  if (props.isLoading) return runtime.jsx("div", { "aria-busy": true, children: "Loading plugin…" });
  const validKey = props.shareKey != null && BUNDLED_SHARE_KEY.test(props.shareKey);
  if (props.error || !validKey || !props.resolvedPluginId) return runtime.jsxs("div", { role: "alert", children: [runtime.jsx("h1", { children: "Plugin not found" }), props.error] });
  const query = new URLSearchParams(props.search ?? ""); query.set("open_in_app", "true");
  return runtime.jsx("a", { "data-redirect": true, href: `/plugins/${encodeURIComponent(props.resolvedPluginId)}?${query.toString()}`, children: "Open plugin" });
}

export { BrowserPluginSharePage };
