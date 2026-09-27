import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/workspace-agent-detail-query";

export interface WorkspaceAgentDetailData { agent: { id: string; name?: string; description?: string }; latest_published_version?: { id?: string; version?: number; [key: string]: unknown } | null; }
export interface WorkspaceAgentDetailPageProps { agentId?: string; useLegacyRoute?: boolean; data?: WorkspaceAgentDetailData | null; isLoading?: boolean; errorStatus?: number; onRetry?(): void; onOpenLegacy?(): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function WorkspaceAgentDetailPage(props: WorkspaceAgentDetailPageProps): unknown {
  const runtime = ensureJsx();
  if (!props.agentId) return runtime.jsx("a", { "data-redirect": true, href: "/", children: "Go home" });
  if (props.useLegacyRoute) return runtime.jsxs("main", { children: [runtime.jsx("h1", { children: "Open this agent in ChatGPT" }), runtime.jsx("button", { type: "button", onClick: props.onOpenLegacy, children: "Open ChatGPT" })] });
  if (props.isLoading) return runtime.jsx("main", { "aria-busy": true, children: "Loading agent…" });
  if (props.errorStatus != null) {
    const message = props.errorStatus === 404 ? "Agent not found" : props.errorStatus === 401 || props.errorStatus === 403 ? "You don't have access to this agent" : "Unable to load agent";
    return runtime.jsxs("main", { role: "alert", children: [runtime.jsx("h1", { children: message }), props.errorStatus >= 500 ? runtime.jsx("button", { type: "button", onClick: props.onRetry, children: "Try again" }) : null] });
  }
  if (!props.data?.latest_published_version) return runtime.jsx("a", { "data-redirect": true, href: `/agents/${encodeURIComponent(props.agentId)}`, children: "Open agent" });
  return runtime.jsxs("main", { className: "workspace-agent-detail-page", "data-agent-id": props.data.agent.id, children: [runtime.jsx("h1", { children: props.data.agent.name ?? "Agent" }), runtime.jsx("p", { children: props.data.agent.description }), runtime.jsx("section", { className: "workspace-agent-chat" })] });
}

export { WorkspaceAgentDetailPage };
