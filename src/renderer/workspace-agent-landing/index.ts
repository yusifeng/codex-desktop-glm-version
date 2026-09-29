// workspace-agent-landing —— Workspace Agent 详情、活动、应用与记忆页。
// 原版：app/webview/assets/workspace-agent-landing-45a102751340.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as suggestionsChunk from "@rchunk/home-suggestion-list";
import * as emptyStateChunk from "@rchunk/compact-empty-state";
import * as surfaceChunk from "@rchunk/surface";
import * as cardChunk from "@rchunk/card-tile";
import * as detailPageChunk from "@rchunk/detail-page";
import * as detailStateChunk from "@rchunk/detail-section-state";
import * as detailQueryChunk from "@rchunk/workspace-agent-detail-query";
import * as readErrorChunk from "@rchunk/read-error";
import * as agentMenuChunk from "@rchunk/agent-menu";

void runtimeChunk; void appPrimaryChunk; void suggestionsChunk; void emptyStateChunk; void surfaceChunk; void cardChunk; void detailPageChunk; void detailStateChunk; void detailQueryChunk; void readErrorChunk;

interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown }
interface ReactRuntime { useEffect(effect: () => void | (() => void), dependencies: unknown[]): void; useRef<T>(value: T): { current: T }; useState<T>(initial: T): [T, (value: T | ((current: T) => T)) => void] }
interface ApiClient { safeGet<Result>(path: string, options?: { signal?: AbortSignal }): Promise<Result> }
interface AppSharedBindings { $3(): void; I3(): JsxRuntime; K2(): void; Y2: unknown; Yh: unknown; e6(): ReactRuntime; n4(): { formatMessage(message: { defaultMessage: string; id: string }): string } }
interface AppInitialBindings { Qgn(): void; o_n(): (path: string, options?: Record<string, unknown>) => void; rJt: ApiClient; utn(): void }
interface MenuBindings { n(): void; t: unknown }
interface AgentVersion { config?: { persistent_folder?: string; tools?: { connectors?: Connector[] } }; icon?: unknown; name: string; starter_prompts?: Array<{ prompt: string; short_description?: string; title: string }>; tagline?: string }
interface Connector { connector_identifier?: { connector_id?: string; server_url?: string; type: string }; name?: string }
interface AgentDetail { agent?: { creator_name?: string | null; is_private_to_creator?: boolean; viewer_capability?: string }; latest_published_version?: AgentVersion }
interface Activity { id: string; invocation?: { channel_name?: string; type?: string }; status?: string; title?: string }

const { $3: initializeRuntime, I3: getJsxRuntime, K2: initializeComponents, Y2: FormattedMessage, Yh: Button, e6: getReactRuntime, n4: useIntl } = appSharedChunk as unknown as AppSharedBindings;
const { Qgn: initializeRouter, o_n: useNavigate, rJt: apiClient, utn: initializeWorkspaceAgents } = appInitialChunk as unknown as AppInitialBindings;
const { n: initializeAgentMenu, t: AgentMenu } = agentMenuChunk as unknown as MenuBindings;
initializeRuntime(); initializeComponents(); initializeRouter(); initializeWorkspaceAgents(); initializeAgentMenu();
const React = getReactRuntime();
const jsx = getJsxRuntime();

export interface WorkspaceAgentLandingProps { composer?: unknown; agentId: string; onStarterPromptSelect?(prompt: string): void }

function WorkspaceAgentLanding({ composer, agentId, onStarterPromptSelect }: WorkspaceAgentLandingProps): unknown {
  const navigate = useNavigate();
  const intl = useIntl();
  const [detail, setDetail] = React.useState<AgentDetail | null>(null);
  const [activity, setActivity] = React.useState<Activity[] | null>(null);
  const [tab, setTab] = React.useState("activity");
  const [error, setError] = React.useState(false);
  const [schedulesOpen, setSchedulesOpen] = React.useState(false);
  const [SchedulesDialog, setSchedulesDialog] = React.useState<unknown>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      apiClient.safeGet<AgentDetail>(`/hermes/agent/${agentId}/detail-view`, { signal: controller.signal }),
      apiClient.safeGet<{ items: Activity[] }>(`/hermes/agent/${agentId}/conversations?limit=25`, { signal: controller.signal }),
    ]).then(([nextDetail, nextActivity]) => { setDetail(nextDetail); setActivity(nextActivity.items); }, () => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [agentId]);

  const version = detail?.latest_published_version;
  const connectors = version?.config?.tools?.connectors ?? [];
  const hasMemory = version?.config?.persistent_folder === "per_user";
  const capability = detail?.agent?.viewer_capability;
  const canViewConfig = capability === "hermes_write" || capability === "hermes_admin" || capability === "hermes_read_config";
  const openSchedules = async (): Promise<void> => {
    const module = await import("@rchunk/workspace-agent-schedules-dialog");
    setSchedulesDialog(() => module.WorkspaceAgentSchedulesDialog);
    setSchedulesOpen(true);
  };

  if (error) return jsx.jsx("section", { role: "alert", children: "Unable to load this agent" });
  if (detail == null || version == null) return jsx.jsx("p", { children: "Loading…" });

  const tabs = ["activity", ...(connectors.length === 0 ? [] : ["apps"]), ...(hasMemory ? ["memory"] : [])];
  let panel: unknown;
  if (tab === "apps") panel = connectors.length === 0 ? jsx.jsx("p", { children: "No apps connected" }) : jsx.jsx("ul", { children: connectors.map((connector, index) => jsx.jsx("li", { children: connector.name ?? connector.connector_identifier?.connector_id ?? connector.connector_identifier?.server_url ?? "App" }, index)) });
  else if (tab === "memory") panel = jsx.jsx("p", { children: "When this agent saves notes and files, they will show up here." });
  else panel = activity == null ? jsx.jsx("p", { children: "Loading activity…" }) : activity.length === 0 ? jsx.jsx("p", { children: "No activity yet. Conversations and automation runs will show up here." }) : jsx.jsx("ol", { children: activity.map((item) => jsx.jsxs("li", { children: [item.title ?? "Agent activity", item.status == null ? null : ` — ${item.status}`] }, item.id)) });

  return jsx.jsxs("div", { className: "relative h-full min-h-0 flex-1 overflow-y-auto", children: [
    jsx.jsxs("header", { children: [
      jsx.jsx("h1", { children: version.name.trim() || agentId }),
      detail.agent?.creator_name != null && !detail.agent.is_private_to_creator ? jsx.jsx("p", { children: `By ${detail.agent.creator_name}` }) : null,
      version.tagline?.trim() ? jsx.jsx("p", { children: version.tagline }) : null,
      jsx.jsx(Button, { "aria-label": intl.formatMessage({ id: "workspaceAgents.schedules.open", defaultMessage: "Automations" }), onClick: () => void openSchedules(), children: "Automations" }),
      canViewConfig ? jsx.jsx(Button, { onClick: () => navigate(`/agents/${agentId}/edit`), children: capability === "hermes_read_config" ? "View agent" : "Edit agent" }) : null,
      jsx.jsx(AgentMenu, { agent: { id: agentId, name: version.name }, isPublished: true, onDeleted: () => navigate("/agents", { replace: true }) }),
    ] }),
    detail.agent?.is_private_to_creator ? jsx.jsx("p", { children: "Private to you" }) : null,
    version.starter_prompts == null || version.starter_prompts.length === 0 ? null : jsx.jsx("section", { children: version.starter_prompts.slice(0, 4).map((prompt) => jsx.jsx("button", { type: "button", disabled: onStarterPromptSelect == null, title: prompt.short_description || prompt.prompt, onClick: () => onStarterPromptSelect?.(prompt.prompt), children: prompt.title }, prompt.prompt)) }),
    composer,
    jsx.jsx("nav", { "aria-label": "Agent details tabs", children: tabs.map((value) => jsx.jsx("button", { type: "button", "aria-pressed": tab === value, onClick: () => setTab(value), children: value[0].toUpperCase() + value.slice(1) }, value)) }),
    panel,
    schedulesOpen && SchedulesDialog != null ? jsx.jsx(SchedulesDialog, { agentId, onClose: () => setSchedulesOpen(false) }) : null,
    jsx.jsx(FormattedMessage, { id: "workspaceAgents.detail.loaded", defaultMessage: "Agent loaded" }),
  ] });
}

export { WorkspaceAgentLanding };
