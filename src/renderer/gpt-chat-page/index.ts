import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface GptDescriptor { id: string; name?: string; description?: string; short_url?: string | null; }
export interface GptChatPageProps { gpt?: GptDescriptor | null; isLoading?: boolean; errorStatus?: number; pathname?: string; search?: string; hash?: string; onRetry?(): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function GptChatPage(props: GptChatPageProps): unknown {
  const runtime = ensureJsx();
  if (props.isLoading || (!props.gpt && props.errorStatus == null)) return runtime.jsx("main", { "aria-busy": true, children: "Loading GPT…" });
  if (!props.gpt) return runtime.jsxs("main", { role: "alert", children: [runtime.jsx("h1", { children: props.errorStatus === 404 ? "GPT not found" : "Unable to load GPT" }), props.errorStatus === 404 ? null : runtime.jsx("button", { type: "button", onClick: props.onRetry, children: "Try again" })] });
  const slug = props.gpt.short_url?.trim() || props.gpt.id;
  const canonicalPath = `/g/${encodeURIComponent(slug)}`;
  if (props.pathname && props.pathname !== canonicalPath) return runtime.jsx("a", { "data-redirect": true, href: `${canonicalPath}${props.search ?? ""}${props.hash ?? ""}`, children: "Continue to GPT" });
  return runtime.jsxs("main", { className: "gpt-chat-page", "data-gpt-id": props.gpt.id, children: [runtime.jsx("h1", { children: props.gpt.name ?? "GPT" }), runtime.jsx("p", { children: props.gpt.description })] });
}

export { GptChatPage };
