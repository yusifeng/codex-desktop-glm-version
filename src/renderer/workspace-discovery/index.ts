import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { rJt as chatGptApi } from "@rchunk/app-initial";
import { n as decodeJwt } from "@rchunk/browser-mfa-jwt";

interface DiscoveryIdentity { email: string; email_domain_type?: string | null }
interface DiscoverableWorkspace { id: string; image_url?: string | null; name: string; requested?: boolean }
interface WorkspaceDiscoveryProps { accessibleWorkspaces?: Array<{ id: string; imageUrl?: string | null; name: string }>; discoverableWorkspaces?: DiscoverableWorkspace[]; email?: string; loading?: boolean; mode?: "blocking" | "dismissible"; onClose?(): void; onRequest?(workspace: DiscoverableWorkspace): Promise<void> | void; section?: "both" | "discoverable" | "existing" }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
const s = "oai/apps/hasSeenWorkspaceDiscoveryFirstLogin";
const r = { $type: "protobuf_analytics_events.v1.ChatgptWorkspaceDiscoveryModalShown" } as const;
const a = { getOptions(userId: string | null) { return { queryKey: ["workspace-discovery", userId], enabled: userId != null, staleTime: 0, retry: false, refetchOnMount: "always" as const, refetchOnWindowFocus: false, queryFn: ({ signal }: { signal?: AbortSignal }) => chatGptApi.safeGet<{ workspaces: DiscoverableWorkspace[] }>("/accounts/discoverable-workspaces", { parameters: { query: { use_k12_lookup: false, include_free_workspaces: false } }, signal }) }; } };
function c(identity: DiscoveryIdentity): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email) && identity.email_domain_type != null && identity.email_domain_type !== "social" && identity.email_domain_type !== "missing"; }
function u(token: string | null | undefined, nowMs: number): boolean { if (token == null) return false; try { const payload = decodeJwt(token) as { pwd_auth_time?: number }; const timestamp = payload.pwd_auth_time; if (typeof timestamp !== "number") return false; const elapsed = nowMs - (timestamp < 1_000_000_000_000 ? timestamp * 1_000 : timestamp); return elapsed >= 0 && elapsed <= 15_000; } catch { return false; } }
function t({ accessibleWorkspaces = [], discoverableWorkspaces = [], email = "", loading = false, mode = "blocking", onClose, onRequest, section = "both" }: WorkspaceDiscoveryProps): unknown {
  const accessible = section === "discoverable" ? [] : accessibleWorkspaces;
  const discoverable = section === "existing" ? [] : discoverableWorkspaces;
  const title = loading || accessible.length + discoverable.length === 0 ? "Join your team’s workspace" : accessible.length === 0 ? "Join workspaces" : discoverable.length === 0 ? "Launch a workspace" : "Join and launch your workspaces";
  return jsx().jsxs("section", { "aria-label": title, "data-mode": mode, children: [jsx().jsx("h1", { children: title }), email === "" ? null : jsx().jsx("p", { children: email }), jsx().jsx("div", { role: "list", children: [...accessible.map(workspace => jsx().jsx("div", { role: "listitem", children: workspace.name }, `existing:${workspace.id}`)), ...discoverable.map(workspace => jsx().jsxs("div", { role: "listitem", children: [workspace.name, jsx().jsx("button", { disabled: workspace.requested === true, onClick: () => onRequest?.(workspace), type: "button", children: workspace.requested ? "Requested" : "Request" })] }, `discoverable:${workspace.id}`))] }), mode === "dismissible" && onClose != null ? jsx().jsx("button", { onClick: onClose, type: "button", children: "Close" }) : null] });
}
function i(): void {}
function l(): void {}
function n(): void {}
function o(): void {}
export { a, c, i, l, n, o, r, s, t, u };
