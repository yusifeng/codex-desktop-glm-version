import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/lock";
import "@rchunk/model-and-reasoning-effort-translations";
import "@rchunk/settings-loading-row";
import "@rchunk/experimental-feature-visibility";
import "@rchunk/plugins-settings-row";
import "@rchunk/settings-route-state";

type ApprovalPolicy = "on-request" | "never";
type SandboxMode = "read-only" | "workspace-write" | "danger-full-access";
type WebSearchMode = "disabled" | "cached" | "indexed" | "live";
type ModelVerbosity = "low" | "medium" | "high" | null;
type ReasoningSummary = "auto" | "concise" | "detailed" | "none";

interface QueryResult<Data> { data: Data | undefined; error?: Error | null; isError?: boolean; isLoading?: boolean; isPending?: boolean; refetch(): void }
interface ConfigValues {
  approval_policy?: ApprovalPolicy;
  model_reasoning_summary?: ReasoningSummary;
  model_verbosity?: Exclude<ModelVerbosity, null>;
  sandbox_mode?: SandboxMode;
  sandbox_workspace_write?: { network_access?: boolean };
  web_search?: WebSearchMode;
}
interface ConfigLayer {
  config?: ConfigValues;
  disabledReason?: string | null;
  expectedVersion?: string | null;
  filePath?: string | null;
  kind: "project" | "user" | "managed";
  label: string;
  workspaceRoot?: string | null;
}
interface ConfigResponse { config: ConfigValues; layers: ConfigLayer[] }
interface AgentNotice { details?: string | null; kind: string; path?: string | null; summary: string }
interface Feature { description?: string; displayName?: string; enabled: boolean; name: string }
interface ModelInfo { supportedReasoningEfforts: Array<{ reasoningEffort: string }> }
interface ModelResponse { models: ModelInfo[]; hasModelSupportingMaxReasoningEffort?: boolean; hasModelSupportingUltraReasoningEffort?: boolean }
interface PrimaryRuntime {
  diagnoseDependencies(options: { hostId: string; probeExecutables?: boolean }): Promise<{ bundleVersion?: string; installed: boolean; problems: unknown[] }>;
  resetDependencies(options: { hostId: string; release?: string }): Promise<{ bundleVersion?: string; status: string }>;
}
interface Mutation { isPending: boolean; mutate(variables: unknown, callbacks?: { onError?(): void; onSuccess?(): void }): void; mutateAsync(variables?: unknown): Promise<unknown> }
interface ScopeApi { get(signal: unknown, parameter?: unknown): Mutation | ToastManager }
interface ToastManager { danger(message: string): void; success(message: string): void; warning(message: string): void }

const sharedRuntime = appSharedChunk as unknown as {
  $3(): void;
  BX<Data>(query: unknown, parameter: unknown): QueryResult<Data>;
  I3(): import("@rchunk/app-shared").JsxRuntime;
  LX(scope: unknown): ScopeApi;
  ZI: unknown;
  e6(): import("@rchunk/app-shared").ReactRuntime;
  n4(): import("@rchunk/app-shared").IntlShape;
  pk: unknown;
};
const { $3: initializeRuntimeLazy, BX: useScopedQuery, I3: getJsxRuntime, LX: useScope, ZI: AppScope, e6: getReactRuntime, n4: useIntl, pk: toastManagerSignal } = sharedRuntime;

const initialRuntime = appInitialChunk as unknown as {
  Gv(): { selectedHostId: string };
  Mt: unknown;
  Nt: unknown;
  O8(scope: unknown, options: { enabled: boolean; hostId: string; reasoningEffort: string }): void;
  Qut(options: { hostId: string; path: string; workspaceRoot?: string | null }): void;
  Tt: { primaryRuntime?: PrimaryRuntime | null };
  Vfn(hostId: string): { kind: string };
  acn(workspaceRoot: string | null, options: { cwdMode: string; hostId: string }): QueryResult<ConfigResponse>;
  cnt(options: { hostId: string }): Mutation;
  ofn(gate: string): boolean;
  ont: unknown;
  ti: unknown;
  ucn: unknown;
  w8(options: { hostId: string }): QueryResult<ModelResponse>;
};
const { Gv: useSelectedHost, Mt: configNoticesQuery, Nt: configWriteMutation, O8: updateReasoningEffort, Qut: openPath, Tt: runtimeRegistry, Vfn: getHost, acn: useConfigQuery, cnt: useFeatureMutation, ofn: useFeatureGate, ont: featuresQuery, ti: noticeQuery, ucn: alternateConfigWriteMutation, w8: useModelsQuery } = initialRuntime;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function Section({ children, subtitle, title }: { children: unknown; subtitle?: string; title: string }): unknown {
  return jsx.jsxs("section", { className: "overflow-hidden rounded-xl border border-token-border-light", children: [
    jsx.jsxs("header", { className: "border-b px-4 py-3", children: [jsx.jsx("h2", { className: "font-semibold", children: title }), subtitle == null ? null : jsx.jsx("p", { className: "text-sm text-secondary", children: subtitle })] }),
    jsx.jsx("div", { className: "divide-y divide-token-border-light", children }),
  ] });
}

function Row({ control, description, label }: { control?: unknown; description?: unknown; label: unknown }): unknown {
  return jsx.jsxs("div", { className: "flex min-h-14 items-center justify-between gap-4 px-4 py-3", children: [
    jsx.jsxs("div", { className: "min-w-0", children: [jsx.jsx("div", { className: "font-medium", children: label }), description == null ? null : jsx.jsx("div", { className: "mt-0.5 text-sm text-secondary", children: description })] }),
    control == null ? null : jsx.jsx("div", { className: "shrink-0", children: control }),
  ] });
}

function Select<Value extends string>({ disabled, label, onChange, options, value }: { disabled: boolean; label: string; onChange(value: Value): void; options: readonly Value[]; value: Value }): unknown {
  return jsx.jsx("select", { "aria-label": label, disabled, value, onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value as Value), children: options.map((option) => jsx.jsx("option", { value: option, children: option }, option)) });
}

function Toggle({ checked, disabled, label, onChange }: { checked: boolean; disabled: boolean; label: string; onChange(value: boolean): void }): unknown {
  return jsx.jsx("button", { type: "button", role: "switch", "aria-label": label, "aria-checked": checked, disabled, onClick: () => onChange(!checked), children: checked ? "On" : "Off" });
}

function Configuration({ hostId }: { hostId: string }): unknown {
  const appScope = useScope(AppScope);
  const query = useConfigQuery(null, { cwdMode: hostId === "local" ? "fallback-to-workspace" : "preserve-null", hostId });
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  if (query.isLoading || query.isPending) return jsx.jsx(Section, { title: "Agent defaults", children: jsx.jsx("div", { className: "p-4", role: "status", children: "Loading agent configuration…" }) });
  if (query.isError || query.error != null) return jsx.jsx(Section, { title: "Agent defaults", children: jsx.jsx(Row, { label: "Couldn't load agent configuration", description: query.error?.message, control: jsx.jsx("button", { type: "button", onClick: query.refetch, children: "Retry" }) }) });
  const layers = query.data?.layers ?? [];
  const selected = layers.find((layer) => (layer.filePath ?? layer.kind) === selectedKey) ?? layers[0] ?? null;
  const effective = { ...(query.data?.config ?? {}), ...(selected?.config ?? {}) };
  const readOnly = selected == null || selected.kind === "managed" || selected.filePath == null || selected.disabledReason != null;
  const write = (field: string, keyPath: string, value: unknown) => {
    if (readOnly || pending.includes(field) || selected?.filePath == null) return;
    setPending((current) => [...current, field]);
    setErrors((current) => ({ ...current, [field]: undefined }));
    const candidate = appScope.get(configWriteMutation, hostId);
    const mutation = ("mutateAsync" in candidate ? candidate : appScope.get(alternateConfigWriteMutation, hostId)) as Mutation;
    void mutation.mutateAsync({ expectedVersion: selected.expectedVersion ?? null, filePath: selected.filePath, hostId, keyPath, kind: selected.kind, value }).catch(() => {
      setErrors((current) => ({ ...current, [field]: "Couldn't update this setting. Check config.toml for errors and try again" }));
    }).finally(() => setPending((current) => current.filter((item) => item !== field)));
  };
  const approval = effective.approval_policy ?? "on-request";
  const sandbox = effective.sandbox_mode ?? "read-only";
  const webSearch = effective.web_search ?? (sandbox === "read-only" ? "cached" : "live");
  return jsx.jsx(Section, { title: "Agent defaults", subtitle: selected?.disabledReason ?? undefined, children: [
    jsx.jsx(Row, { label: "Configuration scope", description: selected?.filePath ?? "Config scope unavailable.", control: jsx.jsxs("div", { children: [
      jsx.jsx("select", { "aria-label": "Configuration scope", value: selected?.filePath ?? selected?.kind ?? "", onChange: (event: { currentTarget: { value: string } }) => { setSelectedKey(event.currentTarget.value); setErrors({}); }, children: layers.map((layer) => jsx.jsx("option", { value: layer.filePath ?? layer.kind, children: layer.label }, layer.filePath ?? layer.kind)) }),
      jsx.jsx("button", { type: "button", disabled: selected?.filePath == null, onClick: () => selected?.filePath == null ? undefined : openPath({ hostId, path: selected.filePath, workspaceRoot: selected.workspaceRoot }), children: "Open config.toml" }),
    ] }) }),
    jsx.jsx(Row, { label: "Approval policy", description: errors.approval ?? "Choose when ChatGPT asks for approval", control: jsx.jsx(Select<ApprovalPolicy>, { disabled: readOnly || pending.includes("approval"), label: "Approval policy", options: ["on-request", "never"], value: approval, onChange: (value) => write("approval", "approval_policy", value) }) }),
    jsx.jsx(Row, { label: "Sandbox mode", description: errors.sandbox ?? "Choose how much ChatGPT can do when running commands", control: jsx.jsx(Select<SandboxMode>, { disabled: readOnly || pending.includes("sandbox"), label: "Sandbox mode", options: ["read-only", "workspace-write", "danger-full-access"], value: sandbox, onChange: (value) => write("sandbox", "sandbox_mode", value) }) }),
    sandbox === "workspace-write" ? jsx.jsx(Row, { label: "Network access", description: errors.network ?? "Allow network access when the sandbox is set to workspace write", control: jsx.jsx(Toggle, { checked: effective.sandbox_workspace_write?.network_access === true, disabled: readOnly || pending.includes("network"), label: "Allow network access", onChange: (value) => write("network", "sandbox_workspace_write.network_access", value) }) }) : null,
    jsx.jsx(Row, { label: "Web search", description: errors.webSearch ?? "Choose how ChatGPT accesses the web", control: jsx.jsx(Select<WebSearchMode>, { disabled: readOnly || pending.includes("webSearch"), label: "Web search", options: ["disabled", "cached", "indexed", "live"], value: webSearch, onChange: (value) => write("webSearch", "web_search", value) }) }),
    jsx.jsx(Row, { label: "Model verbosity", description: errors.modelVerbosity ?? "Choose how much detail ChatGPT includes in responses", control: jsx.jsx(Select<Exclude<ModelVerbosity, null>>, { disabled: readOnly || pending.includes("modelVerbosity"), label: "Model verbosity", options: ["low", "medium", "high"], value: effective.model_verbosity ?? "medium", onChange: (value) => write("modelVerbosity", "model_verbosity", value) }) }),
    jsx.jsx(Row, { label: "Reasoning summary", description: errors.reasoningSummary ?? "Choose how ChatGPT summarizes its reasoning", control: jsx.jsx(Select<ReasoningSummary>, { disabled: readOnly || pending.includes("reasoningSummary"), label: "Reasoning summary", options: ["auto", "concise", "detailed", "none"], value: effective.model_reasoning_summary ?? "auto", onChange: (value) => write("reasoningSummary", "model_reasoning_summary", value) }) }),
  ] });
}

function ModelFeatures({ hostId }: { hostId: string }): unknown {
  const scope = useScope(AppScope);
  const query = useModelsQuery({ hostId });
  if (query.data == null) return null;
  const efforts = [...new Set(query.data.models.flatMap((model) => model.supportedReasoningEfforts.map((item) => item.reasoningEffort)))].filter((effort) => effort === "max" || effort === "ultra" || effort === "persistent");
  if (efforts.length === 0) return null;
  return jsx.jsx(Section, { title: "Model features", children: jsx.jsx(Row, { label: "Available reasoning efforts", description: "Choose which reasoning effort levels appear in model controls. Availability varies by model", control: jsx.jsx("div", { children: efforts.map((effort) => jsx.jsx("button", { type: "button", "aria-label": "Toggle " + effort, onClick: () => updateReasoningEffort(scope, { enabled: false, hostId, reasoningEffort: effort }), children: effort }, effort)) }) }) });
}

function ExperimentalFeatures({ hostId }: { hostId: string }): unknown {
  const query = useScopedQuery<Feature[]>(featuresQuery, hostId);
  const mutation = useFeatureMutation({ hostId });
  return jsx.jsx(Section, { title: "Experimental features (Beta)", children: [
    query.isLoading ? jsx.jsx("div", { className: "p-4", role: "status", children: "Loading experimental features…" }) : null,
    query.data?.length === 0 ? jsx.jsx(Row, { label: "No beta experimental features available" }) : null,
    ...(query.data ?? []).map((feature) => jsx.jsx(Row, { label: feature.displayName ?? feature.name, description: feature.description, control: jsx.jsx(Toggle, { checked: feature.enabled, disabled: mutation.isPending, label: "Toggle " + (feature.displayName ?? feature.name), onChange: (enabled) => mutation.mutate({ enabled, featureName: feature.name }) }) }, feature.name)),
  ] });
}

function WorkspaceDependencies({ hostId }: { hostId: string }): unknown {
  const scope = useScope(AppScope);
  const toast = scope.get(toastManagerSignal) as ToastManager;
  const runtime = runtimeRegistry.primaryRuntime;
  const features = useScopedQuery<Feature[]>(featuresQuery, hostId);
  const featureMutation = useFeatureMutation({ hostId });
  const [busy, setBusy] = React.useState(false);
  if (runtime == null) return null;
  const dependency = features.data?.find((feature) => feature.name === "codex_primary_runtime_dependencies");
  const enabled = dependency?.enabled === true;
  const run = (kind: "diagnose" | "reset") => {
    setBusy(true);
    const action = kind === "diagnose" ? runtime.diagnoseDependencies({ hostId, probeExecutables: true }) : runtime.resetDependencies({ hostId });
    void action.then((result) => {
      if (kind === "diagnose" && "installed" in result && !result.installed) toast.warning("Codex dependencies may need repair. Send /feedback if this keeps happening");
      else toast.success(kind === "diagnose" ? "Codex dependencies look healthy" : "Codex dependencies were reinstalled");
    }).catch(() => toast.danger(kind === "diagnose" ? "Couldn’t diagnose Codex dependencies" : "Couldn’t reinstall Codex dependencies")).finally(() => setBusy(false));
  };
  return jsx.jsx(Section, { title: "Workspace dependencies", children: [
    jsx.jsx(Row, { label: "Codex dependencies", description: "Allow ChatGPT to install and expose bundled Node.js and Python tools", control: jsx.jsx(Toggle, { checked: enabled, disabled: dependency == null || featureMutation.isPending, label: "Enable Codex dependencies", onChange: (value) => featureMutation.mutate({ enabled: value, featureName: "codex_primary_runtime_dependencies" }) }) }),
    jsx.jsx(Row, { label: "Diagnose workspace dependencies", description: "Checks the current bundle and records diagnostic logs", control: jsx.jsx("button", { type: "button", disabled: busy, onClick: () => run("diagnose"), children: "Diagnose" }) }),
    jsx.jsx(Row, { label: "Reset workspace dependencies", description: "Downloads a fresh bundle, installs it, and reloads tools", control: jsx.jsx("button", { type: "button", disabled: busy || !enabled, onClick: () => run("reset"), children: "Reinstall" }) }),
  ] });
}

function AgentSettings(): unknown {
  initializeAgentSettings();
  const { selectedHostId } = useSelectedHost();
  const host = getHost(selectedHostId);
  const notices = useScopedQuery<AgentNotice[]>(configNoticesQuery ?? noticeQuery, selectedHostId).data ?? [];
  const showConfiguration = useFeatureGate("2106641128");
  const showExperimental = useFeatureGate("3693343337");
  const showDependencies = useFeatureGate("3026692602") && host.kind === "local";
  const intl = useIntl();
  return jsx.jsxs("div", { className: "flex h-full min-h-0 flex-col", children: [
    jsx.jsxs("header", { className: "border-b px-5 py-4", children: [jsx.jsx("h1", { className: "text-lg font-semibold", children: "Agent" }), jsx.jsx("p", { className: "text-sm text-secondary", children: "Configure permissions, web access, and agent responses for new chats Learn more" })] }),
    jsx.jsx("main", { className: "flex-1 overflow-auto p-5", children: jsx.jsxs("div", { className: "mx-auto flex max-w-3xl flex-col gap-5", children: [
      notices.length === 0 ? null : jsx.jsx(Section, { title: intl.formatMessage({ id: "settings.agent.configuration.title", defaultMessage: "Agent defaults" }), children: notices.map((notice, index) => jsx.jsx(Row, { label: notice.summary, description: notice.details, control: notice.path == null ? undefined : jsx.jsx("button", { type: "button", onClick: () => openPath({ hostId: selectedHostId, path: notice.path as string }), children: "Open file" }) }, notice.kind + index)) }),
      showConfiguration ? jsx.jsx(Configuration, { hostId: selectedHostId }) : null,
      useFeatureGate("agent-model-features") ? jsx.jsx(ModelFeatures, { hostId: selectedHostId }) : null,
      showExperimental ? jsx.jsx(ExperimentalFeatures, { hostId: selectedHostId }) : null,
      showDependencies ? jsx.jsx(WorkspaceDependencies, { hostId: selectedHostId }) : null,
    ] }) }),
  ] });
}

let initialized = false;
function initializeAgentSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeAgentSettings();
export { AgentSettings };
