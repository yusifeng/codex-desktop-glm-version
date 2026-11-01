import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/building";
import { n as initializeHooksRuntime } from "@rchunk/hooks";
import {
  a as initializeHooksSettingsCopy,
  n as getHookEventLabel,
  r as getFallbackHookTitle,
  t as getHookEventDescription,
} from "@rchunk/hooks-settings-copy";
import {
  a as filterHooksByEvent,
  m as hookNeedsReview,
  p as initializeHooksSettingsModel,
  u as resolveSourceSelection,
} from "@rchunk/hooks-settings-model";
import * as hooksSettingsRouteChunk from "@rchunk/hooks-settings-route";
import "@rchunk/shield-check";
import "@rchunk/settings-loading-row";

type HookSource = "admin" | "plugin" | "project" | "sessionFlags" | "unknown" | "user";

interface HookDefinition extends Record<string, unknown> {
  command?: string | null;
  currentHash?: string;
  displayOrder: number;
  enabled: boolean;
  eventName: string;
  handlerType: "agent" | "command" | "mcpTool" | "prompt" | string;
  isManaged?: boolean;
  key: string;
  matcher?: string | null;
  pluginId?: string | null;
  source: string;
  sourcePath?: string;
  statusMessage?: string | null;
  timeoutSec?: number;
  trustStatus: string;
}

interface HookIssue { message: string; path: string }
interface HookEntry {
  cwd: string;
  errors: HookIssue[];
  hooks: HookDefinition[];
  warnings: string[];
}
interface SourceSelection {
  pluginId?: string | null;
  projectRoot?: string;
  source: HookSource;
}
interface ProjectRootsResult { labels?: Record<string, string>; roots: string[] }
interface QueryResult<Data> {
  data: Data | undefined;
  error: Error | null;
  isFetching: boolean;
  isPending: boolean;
  refetch(): Promise<{ isSuccess: boolean }>;
}
interface MutationResult { isPending: boolean; mutate(updates: Array<Record<string, unknown>>): void }
interface ToastManager { success(message: string): void }

const sharedRuntime = appSharedChunk as unknown as {
  $3: () => void;
  BX: <Data>(query: unknown, parameter: unknown) => QueryResult<Data>;
  I3: () => import("@rchunk/app-shared").JsxRuntime;
  LX: <T>(scope: T) => import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>;
  ZI: unknown;
  e6: () => import("@rchunk/app-shared").ReactRuntime;
  n4: () => import("@rchunk/app-shared").IntlShape;
  pk: unknown;
};
const {
  $3: initializeRuntimeLazy,
  BX: useScopedQuery,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  n4: useIntl,
  pk: toastManagerSignal,
} = sharedRuntime;

const initialRuntime = appInitialChunk as unknown as {
  Vfn: (hostId: string) => { kind: "local" | "remote" | string };
  Gv: () => { selectedHostId: string; setSelectedHostId(hostId: string): void };
  bcn: unknown;
  Qut: (input: { cwd: string | null; hostId: string; path?: string }) => void;
  kEt: unknown;
  d_n: () => [URLSearchParams, (params: URLSearchParams, options?: { replace?: boolean }) => void];
  EEt: unknown;
};
const {
  Vfn: useHost,
  Gv: useSelectedHost,
  bcn: projectRootsQuery,
  Qut: openConfigFile,
  kEt: hookUpdateMutation,
  d_n: useSearchParams,
  EEt: hooksQuery,
} = initialRuntime;

const hooksSettingsRouteRuntime = hooksSettingsRouteChunk as unknown as {
  i: (params: URLSearchParams, hostId: string, selection: SourceSelection | null) => void;
  r: () => void;
};
const {
  i: updateHooksSettingsSearchParams,
  r: initializeHooksSettingsRoute,
} = hooksSettingsRouteRuntime;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function sourceLabel(source: HookSource): string {
  switch (source) {
    case "admin": return "Admin config";
    case "plugin": return "Plugin";
    case "project": return "Project config";
    case "sessionFlags": return "Session flags";
    case "unknown": return "Unknown source";
    case "user": return "User config";
  }
}

function normalizeSource(source: string): HookSource {
  if (source === "plugin" || source === "project" || source === "sessionFlags" || source === "unknown" || source === "user") return source;
  return "admin";
}

function hookMatchesSelection(hook: HookDefinition, entry: HookEntry, selection: SourceSelection): boolean {
  if (selection.source === "project") return normalizeSource(hook.source) === "project" && entry.cwd === selection.projectRoot;
  if (selection.source === "plugin") return hook.source === "plugin" && (selection.pluginId === undefined || hook.pluginId === selection.pluginId);
  return normalizeSource(hook.source) === selection.source;
}

function sourceCards(entries: HookEntry[], labels: Record<string, string>): Array<{ count: number; id: string; label: string; selection: SourceSelection }> {
  const cards = new Map<string, { count: number; id: string; label: string; selection: SourceSelection }>();
  for (const entry of entries) for (const hook of entry.hooks) {
    const source = normalizeSource(hook.source);
    const selection: SourceSelection = source === "project"
      ? { source, projectRoot: entry.cwd }
      : source === "plugin"
        ? { source, pluginId: hook.pluginId }
        : { source };
    const id = source === "project" ? "project:" + entry.cwd : source === "plugin" ? "plugin:" + (hook.pluginId ?? "unknown") : source;
    const label = source === "project" ? labels[entry.cwd] ?? entry.cwd : source === "plugin" ? hook.pluginId ?? "Unknown plugin" : sourceLabel(source);
    const current = cards.get(id);
    if (current == null) cards.set(id, { count: 1, id, label, selection });
    else current.count += 1;
  }
  return [...cards.values()];
}

function SettingRow({ control, description, label, onClick }: { control?: unknown; description?: string; label: string; onClick?(): void }): unknown {
  const content = jsx.jsxs("div", { className: "min-w-0", children: [
    jsx.jsx("div", { className: "font-medium", children: label }),
    description == null ? null : jsx.jsx("div", { className: "mt-0.5 text-sm text-secondary", children: description }),
  ] });
  return jsx.jsxs(onClick == null ? "div" : "button", {
    type: onClick == null ? undefined : "button",
    className: "flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left",
    onClick,
    children: [content, control == null ? null : jsx.jsx("div", { className: "shrink-0", children: control })],
  });
}

function Toggle({ checked, disabled, label, onChange }: { checked: boolean; disabled: boolean; label: string; onChange(value: boolean): void }): unknown {
  return jsx.jsx("button", { type: "button", role: "switch", "aria-label": label, "aria-checked": checked, disabled, onClick: () => onChange(!checked), children: checked ? "On" : "Off" });
}

function HookDetails({ hook }: { hook: HookDefinition }): unknown {
  return jsx.jsxs("dl", { className: "grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 border-t px-3 py-3 text-sm", children: [
    jsx.jsx("dt", { children: "Handler" }), jsx.jsx("dd", { children: hook.handlerType }),
    hook.command == null ? null : jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("dt", { children: "Command" }), jsx.jsx("dd", { children: hook.command })] }),
    hook.matcher == null ? null : jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("dt", { children: "Matcher" }), jsx.jsx("dd", { children: hook.matcher })] }),
    jsx.jsx("dt", { children: "Timeout" }), jsx.jsx("dd", { children: String(hook.timeoutSec ?? 0) + " sec" }),
    hook.statusMessage == null ? null : jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("dt", { children: "Status message" }), jsx.jsx("dd", { children: hook.statusMessage })] }),
  ] });
}

function HookEventGroup({
  eventName,
  hooks,
  hostId,
  isRemote,
  onTrust,
  onToggle,
  projectRoot,
}: {
  eventName: string;
  hooks: HookDefinition[];
  hostId: string;
  isRemote: boolean;
  onTrust(hook: HookDefinition): void;
  onToggle(hook: HookDefinition, enabled: boolean): void;
  projectRoot: string;
}): unknown {
  const intl = useIntl();
  const [expanded, setExpanded] = React.useState<string | null>(null);
  return jsx.jsxs("section", { className: "overflow-hidden rounded-xl border border-token-border-light", children: [
    jsx.jsxs("header", { className: "border-b px-4 py-3", children: [
      jsx.jsx("h3", { className: "font-semibold", children: getHookEventLabel(eventName, intl) ?? eventName }),
      jsx.jsx("p", { className: "text-sm text-secondary", children: getHookEventDescription(eventName, intl) }),
    ] }),
    hooks.map((hook, index) => {
      const review = hookNeedsReview(hook);
      const managed = hook.isManaged === true || hook.trustStatus === "managed";
      const open = expanded === hook.key;
      const title = hook.command?.trim() || getFallbackHookTitle(index, intl);
      return jsx.jsxs("div", { className: "border-t first:border-t-0", children: [
        jsx.jsxs("div", { className: "flex min-h-14 items-center gap-3 px-4 py-2", children: [
          jsx.jsx("button", { type: "button", "aria-expanded": open, className: "min-w-0 flex-1 text-left", onClick: () => setExpanded(open ? null : hook.key), children: title }),
          !isRemote && hook.sourcePath != null ? jsx.jsx("button", { type: "button", "aria-label": "Open config file", onClick: () => openConfigFile({ cwd: hook.source === "project" ? projectRoot : null, hostId, path: hook.sourcePath }), children: "Open" }) : null,
          review ? jsx.jsx("button", { type: "button", onClick: () => onTrust(hook), children: "Trust" }) : null,
          managed ? jsx.jsx("span", { role: "switch", "aria-label": title, "aria-checked": true, "aria-disabled": true, children: "Managed" }) : jsx.jsx(Toggle, { label: title, checked: hook.enabled && !review, disabled: review, onChange: (enabled) => onToggle(hook, enabled) }),
        ] }),
        open ? jsx.jsx(HookDetails, { hook }) : null,
      ] }, hook.key);
    }),
  ] });
}

function HooksSettings(): unknown {
  initializeHooksSettings();
  const scope = useScope(AppScope);
  const intl = useIntl();
  const [params, setParams] = useSearchParams();
  const { selectedHostId, setSelectedHostId } = useSelectedHost();
  const requestedHostId = params.get("hostId");
  const hostId = requestedHostId ?? selectedHostId;
  React.useEffect(() => { if (requestedHostId != null && requestedHostId !== selectedHostId) setSelectedHostId(requestedHostId); }, [requestedHostId, selectedHostId]);
  const rootsResult = useScopedQuery<ProjectRootsResult>(projectRootsQuery, { hostId });
  const roots = rootsResult.data?.roots ?? [];
  const hooksResult = useScopedQuery<{ data: HookEntry[] }>(hooksQuery, { hostId, cwds: roots });
  const updateMutation = useScopedQuery<MutationResult>(hookUpdateMutation, hostId).data;
  const selection = resolveSourceSelection({
    source: params.get("source"),
    projectRoot: params.get("projectRoot") ?? undefined,
    pluginId: params.get("pluginId"),
    projectRoots: roots,
  }) as unknown as SourceSelection | null;
  const entries = hooksResult.data?.data ?? [];
  const cards = sourceCards(entries, rootsResult.data?.labels ?? {});
  const selectedHooks = selection == null ? [] : entries.flatMap((entry) => entry.hooks.filter((hook) => hookMatchesSelection(hook, entry, selection)));
  const selectedEntry = selection?.source === "project" ? entries.find((entry) => entry.cwd === selection.projectRoot) : entries[0];
  const selectSource = (next: SourceSelection | null) => {
    const updated = new URLSearchParams(params);
    updateHooksSettingsSearchParams(updated, hostId, next);
    setParams(updated, { replace: true });
  };
  const refresh = () => { void hooksResult.refetch().then((result) => { if (result.isSuccess) (scope.get(toastManagerSignal as never) as unknown as ToastManager).success("Refreshed hooks"); }); };
  const toggleHook = (hook: HookDefinition, enabled: boolean) => updateMutation?.mutate([{ key: hook.key, enabled }]);
  const trustHook = (hook: HookDefinition) => updateMutation?.mutate([{ key: hook.key, trustedHash: hook.currentHash }]);
  const loading = rootsResult.isPending || hooksResult.isPending;
  const loadError = hooksResult.error;
  const isRemote = useHost(hostId).kind !== "local";
  const eventNames = [...new Set(selectedHooks.map((hook) => hook.eventName))];

  return jsx.jsxs("div", { className: "flex h-full min-h-0 flex-col", children: [
    jsx.jsxs("header", { className: "flex items-start justify-between gap-4 border-b px-5 py-4", children: [
      jsx.jsxs("div", { children: [jsx.jsx("h1", { className: "text-lg font-semibold", children: "Hooks" }), jsx.jsx("p", { className: "text-sm text-secondary", children: "Manage lifecycle hooks from config and enabled plugins." })] }),
      jsx.jsx("button", { type: "button", "aria-label": "Reload hooks", disabled: roots.length === 0 || loading || hooksResult.isFetching, onClick: refresh, children: hooksResult.isFetching ? "Refreshing…" : "Reload" }),
    ] }),
    jsx.jsx("main", { className: "flex-1 overflow-auto p-5", children: loading
      ? jsx.jsx("div", { role: "status", children: "Loading hooks…" })
      : loadError != null
        ? jsx.jsxs("div", { role: "alert", children: [jsx.jsx("p", { children: "Could not load hooks" }), jsx.jsx("p", { children: loadError.message }), jsx.jsx("button", { type: "button", onClick: refresh, children: "Retry" })] })
        : cards.length === 0
          ? jsx.jsxs("div", { children: [jsx.jsx("h2", { children: "No hooks found" }), jsx.jsx("p", { children: "Configured hooks will appear here" })] })
          : jsx.jsxs("div", { className: "grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]", children: [
            jsx.jsx("section", { className: "overflow-hidden rounded-xl border", children: cards.map((card) => jsx.jsx(SettingRow, { label: card.label, description: card.count + (card.count === 1 ? " hook" : " hooks"), onClick: () => selectSource(card.selection) }, card.id)) }),
            selection == null ? jsx.jsx("div", { className: "text-secondary", children: "Select a hook source" }) : jsx.jsxs("div", { className: "flex flex-col gap-4", children: [
              (selectedEntry?.warnings.length ?? 0) + (selectedEntry?.errors.length ?? 0) > 0 ? jsx.jsx("div", { role: "alert", children: String((selectedEntry?.warnings.length ?? 0) + (selectedEntry?.errors.length ?? 0)) + " issues loading hooks for this source" }) : null,
              selectedHooks.some((hook) => hookNeedsReview(hook)) ? jsx.jsx("div", { children: "Hooks can run outside of the sandbox, so review recently installed or modified hooks." }) : null,
              ...eventNames.map((eventName) => jsx.jsx(HookEventGroup, { eventName, hooks: filterHooksByEvent(selectedHooks, eventName) as HookDefinition[], hostId, isRemote, onTrust: trustHook, onToggle: toggleHook, projectRoot: selection.projectRoot ?? "" }, eventName)),
            ] }),
          ] }),
    }),
  ] });
}

let initialized = false;
function initializeHooksSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeHooksRuntime();
  initializeHooksSettingsCopy();
  initializeHooksSettingsModel();
  initializeHooksSettingsRoute();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeHooksSettings();
export { HooksSettings };
