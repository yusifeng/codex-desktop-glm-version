// workspace-agents-page —— Workspace Agents 索引、目录搜索与分页。
// 原版：app/webview/assets/workspace-agents-page-d9791442259b.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as gridChunk from "@rchunk/skills-page-grid";
import * as agentMenuChunk from "@rchunk/agent-menu";

void runtimeChunk;
void appPrimaryChunk;

interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown }
interface ReactRuntime { useEffect(effect: () => void | (() => void), dependencies: unknown[]): void; useState<T>(initial: T): [T, (value: T | ((current: T) => T)) => void] }
interface ApiClient { safeGet<Result>(path: string, options?: { signal?: AbortSignal }): Promise<Result> }
interface AppSharedBindings { $3(): void; HX(signal: unknown): unknown; I3(): JsxRuntime; K2(): void; Y2: unknown; Yh: unknown; e6(): ReactRuntime; n4(): { formatMessage(message: { defaultMessage: string; id: string }, values?: Record<string, unknown>): string } }
interface AppInitialBindings { Bw: unknown; Qgn(): void; mun: unknown; o_n(): (path: string, options?: Record<string, unknown>) => void; rJt: ApiClient; stn(): void; utn(): void }
interface GridBindings { n: unknown; r(): void; t: unknown }
interface MenuBindings { n(): void; t: unknown }
interface WorkspaceAgent { creator_name?: string | null; description?: string | null; id: string; is_public?: boolean; latest_published_version_id?: string | null; name: string; store_visible?: boolean; tagline?: string | null; updated_at?: string | null }
interface AgentResponse { items: WorkspaceAgent[]; next_cursor?: string | null }
type AgentView = "recent" | "owned" | "directory";

const { $3: initializeRuntime, HX: useSignal, I3: getJsxRuntime, K2: initializeComponents, Y2: FormattedMessage, Yh: Button, e6: getReactRuntime, n4: useIntl } = appSharedChunk as unknown as AppSharedBindings;
const { Bw: buildPermissionSignal, Qgn: initializeRouter, mun: accountIdSignal, o_n: useNavigate, rJt: apiClient, stn: initializeWorkspaceAgents, utn: initializeWorkspace } = appInitialChunk as unknown as AppInitialBindings;
const { n: GridContent, r: initializeGrid, t: Grid } = gridChunk as unknown as GridBindings;
const { n: initializeAgentMenu, t: AgentMenu } = agentMenuChunk as unknown as MenuBindings;

initializeRuntime(); initializeComponents(); initializeRouter(); initializeWorkspaceAgents(); initializeWorkspace(); initializeGrid(); initializeAgentMenu();
const React = getReactRuntime();
const jsx = getJsxRuntime();

function WorkspaceAgentsPage(): unknown {
  const intl = useIntl();
  const navigate = useNavigate();
  const accountId = useSignal(accountIdSignal) as string | null;
  const canBuild = useSignal(buildPermissionSignal) === true;
  const [view, setView] = React.useState<AgentView>("recent");
  const [query, setQuery] = React.useState("");
  const [agents, setAgents] = React.useState<WorkspaceAgent[] | null>(null);
  const [error, setError] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const normalizedQuery = query.trim().slice(0, 200);

  React.useEffect(() => {
    if (accountId == null) return;
    const controller = new AbortController();
    setAgents(null); setError(false);
    const path = view === "directory"
      ? normalizedQuery === "" ? "/hermes/workspace-store/agents?limit=50" : `/hermes/workspace-store/agents/search?limit=50&query=${encodeURIComponent(normalizedQuery)}`
      : `/hermes/agents?limit=50&list_type=${view}`;
    void apiClient.safeGet<AgentResponse>(path, { signal: controller.signal }).then((response) => setAgents(response.items), () => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [accountId, normalizedQuery, refreshKey, view]);

  const create = (): void => { if (canBuild) navigate("/agents/new/edit"); };
  let content: unknown;
  if (agents == null && !error) content = jsx.jsx("p", { children: "Loading agents…" });
  else if (error) content = jsx.jsxs("section", { role: "alert", children: ["Couldn’t load agents", jsx.jsx(Button, { onClick: () => setRefreshKey((value) => value + 1), children: "Retry" })] });
  else if (agents?.length === 0) content = jsx.jsx("section", { children: normalizedQuery === "" ? (view === "recent" ? "No recently used agents" : view === "owned" ? "You haven’t built any agents yet" : "No agents in team directory") : `No agents found for “${normalizedQuery}”` });
  else content = jsx.jsx(Grid, { children: jsx.jsx(GridContent, { children: agents?.map((agent) => jsx.jsx(AgentCard, { agent, kind: view, onOpen: () => navigate(`/agents/${agent.id}`) }, agent.id)) }) });

  return jsx.jsxs("div", { className: "flex h-full min-h-0 flex-col bg-surface text-default", children: [
    jsx.jsxs("header", { children: [jsx.jsx("h1", { children: "Workspace Agents" }), jsx.jsx("p", { children: "Keep work moving 24/7 with agents" }), jsx.jsx(Button, { disabled: !canBuild, title: canBuild ? undefined : "You don’t have permission to build agents", onClick: create, children: "Create" })] }),
    jsx.jsxs("nav", { "aria-label": intl.formatMessage({ id: "workspaceAgents.index.views.ariaLabel", defaultMessage: "Agent views" }), children: (["recent", "owned", "directory"] as AgentView[]).map((mode) => jsx.jsx("button", { type: "button", "aria-pressed": view === mode, onClick: () => setView(mode), children: mode === "recent" ? "Recently used" : mode === "owned" ? "Built by me" : "Team directory" }, mode)) }),
    jsx.jsx("input", { id: "workspace-agents-search", "aria-label": "Search agents", placeholder: "Search agents", value: query, onChange: (event: { target: { value: string } }) => setQuery(event.target.value) }),
    content,
  ] });
}

function AgentCard({ agent, kind, onOpen }: { agent: WorkspaceAgent; kind: AgentView; onOpen(): void }): unknown {
  const title = agent.name.trim() || "Unnamed agent";
  const description = agent.tagline?.trim() || agent.description?.trim() || "No description";
  return jsx.jsxs("article", { children: [
    jsx.jsx("button", { type: "button", onClick: onOpen, children: title }),
    jsx.jsx("p", { children: description }),
    kind === "directory" && agent.creator_name != null ? jsx.jsx("p", { children: `By ${agent.creator_name}` }) : null,
    jsx.jsx(AgentMenu, { agent: { id: agent.id, name: title }, isPublished: agent.latest_published_version_id != null }),
  ] });
}

export { WorkspaceAgentsPage };
