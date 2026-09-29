// workspace-agent-builder-page —— Workspace Agent 草稿创建、配置、发布与管理。

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/toolbar-breadcrumb";
import "@rchunk/app-connect-modal";
import "@rchunk/workspace-agent-detail-query";
import { a as DeleteAgentDialog } from "@rchunk/duplicate-agent";
import "@rchunk/read-error";
import { n as trackBuilderEvent } from "@rchunk/builder-analytics";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type ViewerCapability = "hermes_admin" | "hermes_read_config" | "hermes_write" | string;
interface ModelSpec { name: string; reasoning_effort?: string | null }
interface StarterPrompt { description?: string; prompt: string; title: string }
interface Connector { connector_id?: string; id?: string; name?: string; permissions_ready?: boolean }
interface SlackDeployment { channel_id: string; channel_name?: string; handle: string; pending_deletion?: boolean }
interface AgentFields {
  description: string;
  icon: { color: string; name: string };
  instructions: string;
  modelSpec: ModelSpec | null;
  name: string;
  persistentFolder?: { enabled: boolean };
  slackDeployments?: SlackDeployment[];
  starterPrompts: StarterPrompt[];
  tagline: string;
  tools: { connectors: Connector[]; image_generation?: boolean; memory?: boolean; web_search?: boolean };
}
interface ServerBuilder {
  agent: { id: string; is_private_to_creator?: boolean; slack_handle?: string | null; viewer_capability: ViewerCapability };
  draft_revision?: string | null;
  draft_version: {
    config?: { deployments?: { slack?: SlackDeployment[] }; persistent_folder?: { enabled: boolean }; prompt?: string; tools?: AgentFields["tools"] };
    description: string;
    icon: AgentFields["icon"];
    model_spec: ModelSpec | null;
    name: string;
    starter_prompts: StarterPrompt[];
    tagline: string;
  };
  latest_published_version?: { id: string } | null;
}
interface AppOption { description?: string; id: string; name: string; permissions_ready?: boolean }
interface ModelOption { name: string; reasoning_efforts?: string[] }
interface PublishedVersion { created_at?: string; id: string; name?: string; version?: number }
interface QueryService {
  safeDelete?(path: string, options?: Record<string, unknown>): Promise<unknown>;
  safeGet(path: string, options?: Record<string, unknown>): Promise<unknown>;
  safePost(path: string, options?: Record<string, unknown>): Promise<unknown>;
}
interface SharedRuntime {
  $3(): void;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX(scope: unknown): unknown;
  ZI: unknown;
  e6: (() => ReactRuntime) & ReactRuntime;
}
interface InitialRuntime {
  Bw: unknown;
  Hw: unknown;
  Vw: unknown;
  l_n(): { agentId?: string | null };
  mun: unknown;
  o_n(): (path: string, options?: { replace?: boolean }) => void;
  rJt: QueryService;
}

const { $3: initializeRuntime, HX: useSignalValue, I3: getJsxRuntime, LX: useScope, ZI: AppScope, e6: getReactRuntime } = appSharedChunk as unknown as SharedRuntime;
const { Bw: editAgentsSignal, Hw: slackChannelsSignal, Vw: buildAgentsSignal, l_n: useAgentRoute, mun: accountIdSignal, o_n: useNavigate, rJt: api } = appInitialChunk as unknown as InitialRuntime;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializeWorkspaceAgentBuilderPage(): void {
  if (initialized) return;
  initializeRuntime();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

function emptyFields(): AgentFields {
  return { name: "", tagline: "", description: "", instructions: "", modelSpec: null, tools: { connectors: [] }, icon: { name: "bloop", color: "blue" }, starterPrompts: [] };
}
function fieldsFromBuilder(builder: ServerBuilder): AgentFields {
  const version = builder.draft_version;
  return {
    name: version.name, tagline: version.tagline, description: version.description,
    instructions: version.config?.prompt ?? "", modelSpec: version.model_spec,
    tools: version.config?.tools ?? { connectors: [] }, icon: version.icon,
    persistentFolder: version.config?.persistent_folder, starterPrompts: version.starter_prompts,
    slackDeployments: version.config?.deployments?.slack,
  };
}
function validStarterPrompt(prompt: StarterPrompt): boolean { return prompt.title.trim().length > 0 && prompt.prompt.trim().length > 0; }
function serializeFields(fields: AgentFields): Record<string, unknown> {
  return {
    category: "general", skills: [], model_spec: fields.modelSpec, name: fields.name, prompt: fields.instructions,
    description: fields.description, tools: fields.tools, icon: fields.icon, tagline: fields.tagline,
    starter_prompts: fields.starterPrompts,
    ...(fields.persistentFolder == null ? {} : { persistent_folder: fields.persistentFolder }),
    ...(fields.slackDeployments == null ? {} : { deployments: { slack: fields.slackDeployments } }),
  };
}
function errorCode(reason: unknown): string | undefined {
  if (reason != null && typeof reason === "object" && "code" in reason && typeof reason.code === "string") return reason.code;
  return undefined;
}

function WorkspaceAgentBuilderPage(): unknown {
  const { agentId = null } = useAgentRoute();
  const accountId = useSignalValue<string | null>(accountIdSignal);
  const canBuild = useSignalValue<boolean>(buildAgentsSignal) === true;
  const editFeatureEnabled = useSignalValue<boolean>(editAgentsSignal) === true;
  const slackFeatureEnabled = useSignalValue<boolean>(slackChannelsSignal) === true;
  const navigate = useNavigate();
  const scope = useScope(AppScope);
  const [builder, setBuilder] = React.useState<ServerBuilder | null>(null);
  const [fields, setFields] = React.useState<AgentFields>(emptyFields);
  const [apps, setApps] = React.useState<AppOption[]>([]);
  const [models, setModels] = React.useState<ModelOption[]>([]);
  const [versions, setVersions] = React.useState<PublishedVersion[]>([]);
  const [loading, setLoading] = React.useState(agentId != null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [slackOpen, setSlackOpen] = React.useState(false);
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [slackChannel, setSlackChannel] = React.useState("");
  const [slackHandle, setSlackHandle] = React.useState("");

  React.useEffect(() => {
    if (accountId == null) return;
    let active = true;
    setLoading(agentId != null);
    const load = async (): Promise<void> => {
      try {
        const [builderValue, modelValue, appValue, versionValue] = await Promise.all([
          agentId == null ? null : api.safeGet?.("/hermes/agent/{agent_id}/builder-view", { parameters: { path: { agent_id: agentId } } }),
          api.safeGet?.("/hermes/models"), api.safeGet?.("/hermes/apps"),
          agentId == null ? [] : api.safeGet?.("/hermes/agent/{agent_id}/published-versions", { parameters: { path: { agent_id: agentId } } }),
        ]);
        if (!active) return;
        if (builderValue != null) { const next = builderValue as ServerBuilder; setBuilder(next); setFields(fieldsFromBuilder(next)); }
        setModels(((modelValue as { models?: ModelOption[] } | undefined)?.models ?? []));
        setApps(((appValue as { apps?: AppOption[] } | undefined)?.apps ?? []));
        setVersions(Array.isArray(versionValue) ? versionValue as PublishedVersion[] : (versionValue as { versions?: PublishedVersion[] } | undefined)?.versions ?? []);
        setError(null);
      } catch { if (active) setError("load"); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [accountId, agentId]);

  if (accountId == null) return jsx.jsx("div", { role: "status", children: "Loading workspace…" });
  if (loading) return jsx.jsx("div", { role: "status", children: "Loading agent…" });
  if (error === "load") return jsx.jsxs("section", { children: [jsx.jsx("h1", { children: "Unable to load agent" }), jsx.jsx("button", { type: "button", onClick: () => window.location.reload(), children: "Retry" })] });

  const capability = builder?.agent.viewer_capability;
  const canEdit = builder == null ? canBuild : editFeatureEnabled && (capability === "hermes_admin" || capability === "hermes_write");
  const canPublish = builder != null && canEdit && canBuild;
  const canManageSlack = builder != null && capability === "hermes_admin" && canBuild && slackFeatureEnabled;
  const canDelete = builder != null && capability === "hermes_admin";
  const isPublished = builder?.latest_published_version != null;
  const valid = fields.name.trim().length > 0 && fields.instructions.trim().length > 0 && fields.starterPrompts.every(validStarterPrompt);
  const update = (patch: Partial<AgentFields>): void => { setFields((current) => ({ ...current, ...patch })); setSaved(false); };

  const save = async (publish: boolean): Promise<void> => {
    if (pending || !valid || (publish && !canPublish) || (!publish && !canEdit)) return;
    setPending(true); setError(null); setSaved(false);
    try {
      let response: unknown;
      if (builder == null) response = await api.safePost?.("/hermes/agent", { requestBody: serializeFields(fields) });
      else response = await api.safePost?.(publish ? "/hermes/agent/{agent_id}/save_publish" : "/hermes/agent/{agent_id}/save", {
        parameters: { path: { agent_id: builder.agent.id } },
        requestBody: { ...serializeFields(fields), expected_draft_revision: builder.draft_revision ?? null, ...(publish ? { publish_type: "changes" } : {}) },
      });
      trackBuilderEvent(scope as never, { action: builder == null ? "create" : publish ? "publish" : "save", agentId: builder?.agent.id ?? null });
      if (response != null && typeof response === "object" && "draft_version" in response) { const next = response as ServerBuilder; setBuilder(next); setFields(fieldsFromBuilder(next)); }
      if (builder == null && response != null && typeof response === "object" && "id" in response) navigate("/agents/" + String(response.id) + "/edit", { replace: true });
      setSaved(true); setPublishOpen(false);
    } catch (reason) {
      setError(errorCode(reason) === "draft_revision_mismatch" ? "conflict" : "save");
    } finally { setPending(false); }
  };
  const toggleConnector = (app: AppOption): void => update({ tools: { ...fields.tools, connectors: fields.tools.connectors.some((connector) => (connector.id ?? connector.connector_id) === app.id) ? fields.tools.connectors.filter((connector) => (connector.id ?? connector.connector_id) !== app.id) : [...fields.tools.connectors, { id: app.id, name: app.name, permissions_ready: app.permissions_ready }] } });
  const toggleCapability = (key: "image_generation" | "memory" | "web_search"): void => update({ tools: { ...fields.tools, [key]: fields.tools[key] !== true } });
  const addStarter = (): void => update({ starterPrompts: [...fields.starterPrompts, { title: "", description: "", prompt: "" }] });
  const changeStarter = (index: number, patch: Partial<StarterPrompt>): void => update({ starterPrompts: fields.starterPrompts.map((prompt, current) => current === index ? { ...prompt, ...patch } : prompt) });
  const addSlack = (): void => {
    if (!canManageSlack || slackChannel.trim().length === 0 || slackHandle.trim().length === 0) return;
    update({ slackDeployments: [...(fields.slackDeployments ?? []), { channel_id: slackChannel.trim().toUpperCase(), channel_name: slackChannel.trim().replace(/^#/, ""), handle: slackHandle.trim() }] });
    setSlackOpen(false); setSlackChannel("");
  };

  return jsx.jsxs("main", { children: [
    jsx.jsxs("header", { children: [
      jsx.jsx("a", { href: "/agents", children: "Agents" }),
      jsx.jsx("h1", { children: builder == null ? "Create agent" : fields.name.trim() || "Unnamed agent" }),
      builder != null ? jsx.jsx("p", { children: "Changes stay in your draft until you publish" }) : null,
      builder != null && isPublished ? jsx.jsx("button", { type: "button", onClick: () => setHistoryOpen(true), children: "Version history" }) : null,
      canDelete ? jsx.jsx("button", { type: "button", onClick: () => setDeleteOpen(true), children: "Delete" }) : null,
      canEdit ? jsx.jsx("button", { type: "button", disabled: !valid || pending, onClick: () => { void save(false); }, children: builder == null ? "Create draft" : "Save draft" }) : null,
      builder != null && canEdit ? jsx.jsx("button", { type: "button", disabled: !valid || !canPublish || pending, title: canBuild ? undefined : "You don’t have permission to build agents", onClick: () => setPublishOpen(true), children: "Publish" }) : null,
    ] }),
    !canEdit ? jsx.jsx("p", { role: "note", children: "You don’t have permission to edit this agent" }) : null,
    error === "conflict" ? jsx.jsx("p", { role: "alert", children: "This draft changed elsewhere. Your edits are still here. Reload the latest draft before saving." }) : null,
    error === "save" ? jsx.jsx("p", { role: "alert", children: "Couldn’t save the agent. Your edits are still here." }) : null,
    saved ? jsx.jsx("p", { role: "status", children: "Saved" }) : null,
    jsx.jsxs("form", { children: [
      jsx.jsxs("label", { children: ["Name", jsx.jsx("input", { value: fields.name, required: true, disabled: !canEdit || pending, onChange: (event: { target: { value: string } }) => update({ name: event.target.value }) })] }),
      jsx.jsxs("label", { children: ["Tagline", jsx.jsx("input", { value: fields.tagline, disabled: !canEdit || pending, onChange: (event: { target: { value: string } }) => update({ tagline: event.target.value }) })] }),
      jsx.jsxs("label", { children: ["Description", jsx.jsx("textarea", { value: fields.description, disabled: !canEdit || pending, onChange: (event: { target: { value: string } }) => update({ description: event.target.value }) })] }),
      jsx.jsxs("label", { children: ["Instructions", jsx.jsx("textarea", { value: fields.instructions, required: true, disabled: !canEdit || pending, onChange: (event: { target: { value: string } }) => update({ instructions: event.target.value }) })] }),
      jsx.jsxs("section", { children: [jsx.jsx("h2", { children: "Model" }), jsx.jsx("select", { value: fields.modelSpec?.name ?? "auto", disabled: !canEdit || pending, onChange: (event: { target: { value: string } }) => update({ modelSpec: event.target.value === "auto" ? null : { name: event.target.value, reasoning_effort: models.find((model) => model.name === event.target.value)?.reasoning_efforts?.[0] ?? null } }), children: [jsx.jsx("option", { value: "auto", children: "Auto" }), ...models.map((model) => jsx.jsx("option", { value: model.name, children: model.name }, model.name))] }), fields.modelSpec == null ? null : jsx.jsx("select", { value: fields.modelSpec.reasoning_effort ?? "", disabled: !canEdit || pending, onChange: (event: { target: { value: string } }) => update({ modelSpec: { ...fields.modelSpec!, reasoning_effort: event.target.value || null } }), children: (models.find((model) => model.name === fields.modelSpec?.name)?.reasoning_efforts ?? []).map((effort) => jsx.jsx("option", { value: effort, children: effort }, effort)) })] }),
      jsx.jsxs("section", { children: [jsx.jsx("h2", { children: "Capabilities" }), (["memory", "web_search", "image_generation"] as const).map((key) => jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", checked: fields.tools[key] === true, disabled: !canEdit || pending, onChange: () => toggleCapability(key) }), key === "memory" ? "Memory" : key === "web_search" ? "Web search" : "Image generation"] }, key)), jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", checked: fields.persistentFolder?.enabled === true, disabled: !canEdit || pending, onChange: () => update({ persistentFolder: { enabled: fields.persistentFolder?.enabled !== true } }) }), "Persistent folder"] })] }),
      jsx.jsxs("section", { children: [jsx.jsx("h2", { children: "Apps" }), apps.map((app) => jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", checked: fields.tools.connectors.some((connector) => (connector.id ?? connector.connector_id) === app.id), disabled: !canEdit || pending, onChange: () => toggleConnector(app) }), app.name, app.permissions_ready === false ? jsx.jsx("span", { children: "Connection permissions need an update" }) : null] }, app.id))] }),
      jsx.jsxs("section", { children: [jsx.jsx("h2", { children: "Starter prompts" }), jsx.jsx("button", { type: "button", disabled: !canEdit || pending, onClick: addStarter, children: "Add starter prompt" }), fields.starterPrompts.length === 0 ? jsx.jsx("p", { children: "Showcase capabilities" }) : fields.starterPrompts.map((prompt, index) => jsx.jsxs("fieldset", { children: [jsx.jsx("legend", { children: "Starter prompt " + (index + 1) }), jsx.jsx("input", { "aria-label": "Starter prompt name", value: prompt.title, disabled: !canEdit || pending, onChange: (event: { target: { value: string } }) => changeStarter(index, { title: event.target.value }) }), jsx.jsx("input", { "aria-label": "Starter prompt description", value: prompt.description ?? "", disabled: !canEdit || pending, onChange: (event: { target: { value: string } }) => changeStarter(index, { description: event.target.value }) }), jsx.jsx("textarea", { "aria-label": "Starter prompt text", value: prompt.prompt, disabled: !canEdit || pending, onChange: (event: { target: { value: string } }) => changeStarter(index, { prompt: event.target.value }) }), jsx.jsx("button", { type: "button", disabled: !canEdit || pending, onClick: () => update({ starterPrompts: fields.starterPrompts.filter((_, current) => current !== index) }), children: "Remove starter prompt" })] }, index))] }),
      jsx.jsxs("section", { children: [jsx.jsx("h2", { children: "Slack" }), builder == null ? jsx.jsx("p", { children: "Create a draft before adding a Slack channel" }) : fields.slackDeployments?.map((deployment) => jsx.jsx("p", { children: "#" + (deployment.channel_name ?? deployment.channel_id) + " @" + deployment.handle }, deployment.channel_id)), canManageSlack ? jsx.jsx("button", { type: "button", onClick: () => setSlackOpen(true), children: "Add Slack channel" }) : null] }),
    ] }),
    historyOpen ? jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: "Version history" }), versions.length === 0 ? jsx.jsx("p", { children: "No published versions yet" }) : jsx.jsx("ol", { children: versions.map((version) => jsx.jsx("li", { children: version.name ?? "Version " + (version.version ?? version.id) }, version.id)) }), jsx.jsx("button", { type: "button", onClick: () => setHistoryOpen(false), children: "Close" })] }) : null,
    slackOpen ? jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: "Add Slack channel" }), jsx.jsxs("label", { children: ["Slack handle", jsx.jsx("input", { value: slackHandle, onChange: (event: { target: { value: string } }) => setSlackHandle(event.target.value) })] }), jsx.jsxs("label", { children: ["Channel ID or link", jsx.jsx("input", { value: slackChannel, onChange: (event: { target: { value: string } }) => setSlackChannel(event.target.value) })] }), jsx.jsx("button", { type: "button", disabled: slackChannel.trim().length === 0 || slackHandle.trim().length === 0, onClick: addSlack, children: "Add channel" }), jsx.jsx("button", { type: "button", onClick: () => setSlackOpen(false), children: "Cancel" })] }) : null,
    publishOpen ? jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: "Publish " + fields.name + "?" }), jsx.jsx("p", { children: "This saves and publishes the current draft, including its instructions, tools, files, and channel settings" }), jsx.jsx("button", { type: "button", disabled: pending || !canPublish || !valid, onClick: () => { void save(true); }, children: "Publish" }), jsx.jsx("button", { type: "button", onClick: () => setPublishOpen(false), children: "Cancel" })] }) : null,
    deleteOpen && builder != null ? jsx.jsx(DeleteAgentDialog, { agentId: builder.agent.id, onClose: () => setDeleteOpen(false), onDeleted: () => navigate("/agents", { replace: true }) }) : null,
  ] });
}

initializeWorkspaceAgentBuilderPage();
export { WorkspaceAgentBuilderPage };
