import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/app-connect-modal";
import * as hooksSettingsRouteChunk from "@rchunk/hooks-settings-route";
import "@rchunk/use-external-agent-import-setup-actions";
import "@rchunk/setup";
import "@rchunk/settings-loading-row";
import "@rchunk/settings-row-disclosure";

interface DetectedImportItem {
  itemType: string;
  providerId: string;
  title: string;
}
interface UnsupportedProject { name: string }
interface DetectionState {
  detectedItems: DetectedImportItem[];
  isDetecting: boolean;
  isDetectionError: boolean;
  refetchDetectedItems(): void;
  unsupportedProjects: UnsupportedProject[];
}
interface ImportResultItem { itemType: string; source?: string | null; target?: string | null; message?: string }
interface ImportHistory {
  completedAtMs: number;
  failures: ImportResultItem[];
  importId: string;
  providerId: string;
  successes: ImportResultItem[];
}
interface RunningImport { hostId: string; items: DetectedImportItem[]; startedAtMs: number }
interface QueryResult<Data> {
  data: Data | undefined;
  error: Error | null;
  isLoading: boolean;
  refetch(): void;
}
interface SettingDescriptor<Value> { key: string }

const sharedRuntime = appSharedChunk as unknown as {
  $3: () => void;
  BX: <Data>(query: unknown, parameter: unknown) => QueryResult<Data>;
  HX: <Data>(signal: unknown) => Data;
  I3: () => import("@rchunk/app-shared").JsxRuntime;
  LX: <T>(scope: T) => import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>;
  ZI: unknown;
  e6: () => import("@rchunk/app-shared").ReactRuntime;
  n4: () => import("@rchunk/app-shared").IntlShape;
  oz: { syncEnabled: SettingDescriptor<boolean>; syncItemTypes: SettingDescriptor<string[]> };
};
const {
  $3: initializeRuntimeLazy,
  BX: useScopedQuery,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  n4: useIntl,
  oz: importSettings,
} = sharedRuntime;

const initialRuntime = appInitialChunk as unknown as {
  $i: (scope: unknown, options: {
    hostId: string;
    items: DetectedImportItem[];
    preselectedProviderIds: string[];
    restoreFocus?(): void;
    source: string;
  }) => void;
  CA: (options: { enabled: boolean; hostId: string; providers: string[]; workspaceRoots?: string[] }) => DetectionState;
  Kcn: <Value>(setting: SettingDescriptor<Value>) => Value;
  LA: string;
  Ucn: <Value>(scope: unknown, setting: SettingDescriptor<Value>, value: Value) => Promise<void> | void;
  ZA: unknown;
  dj: unknown;
  no: string;
  ofn: (gateId: string) => boolean;
  ugn: string;
  zA: (enabled: boolean) => string[];
};
const {
  $i: openImportFlow,
  CA: useDetectedImports,
  Kcn: useSetting,
  LA: importProvidersGate,
  Ucn: setSetting,
  ZA: importHistoryQuery,
  dj: runningImportSignal,
  no: importPageGate,
  ofn: useFeatureGate,
  ugn: localHostId,
  zA: resolveProviders,
} = initialRuntime;

const routeRuntime = hooksSettingsRouteChunk as unknown as { r: () => void; t: (options: { hostId: string }) => string };
const { r: initializeHooksSettingsRoute, t: buildHooksSettingsUrl } = routeRuntime;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

const PROVIDER_LABELS: Record<string, string> = {
  "claude-code": "Claude Code",
  "claude-cowork": "Claude Cowork",
  cursor: "Cursor",
};

function providerLabel(providerId: string): string { return PROVIDER_LABELS[providerId] ?? providerId; }

function Section({ children, subtitle, title }: { children: unknown; subtitle?: string; title: string }): unknown {
  return jsx.jsxs("section", { className: "overflow-hidden rounded-xl border border-token-border-light", children: [
    jsx.jsxs("header", { className: "border-b px-4 py-3", children: [jsx.jsx("h2", { className: "font-semibold", children: title }), subtitle == null ? null : jsx.jsx("p", { className: "text-sm text-secondary", children: subtitle })] }),
    jsx.jsx("div", { className: "divide-y divide-token-border-light", children }),
  ] });
}

function SettingRow({ control, description, label }: { control?: unknown; description?: unknown; label: unknown }): unknown {
  return jsx.jsxs("div", { className: "flex min-h-14 items-center justify-between gap-4 px-4 py-3", children: [
    jsx.jsxs("div", { className: "min-w-0", children: [jsx.jsx("div", { className: "font-medium", children: label }), description == null ? null : jsx.jsx("div", { className: "mt-0.5 text-sm text-secondary", children: description })] }),
    control == null ? null : jsx.jsx("div", { className: "shrink-0", children: control }),
  ] });
}

function ImportSources({ latestSuccessfulImportAtMs, workspaceRoots }: { latestSuccessfulImportAtMs: number | null; workspaceRoots?: string[] }): unknown {
  const scope = useScope(AppScope);
  const providerGate = useFeatureGate(importProvidersGate);
  const providers = resolveProviders(providerGate);
  const runningImport = useSignalValue<RunningImport | null>(runningImportSignal);
  const detection = useDetectedImports({ enabled: true, hostId: localHostId, providers, workspaceRoots });
  const isRunning = runningImport?.hostId === localHostId;
  const providerIds = [...new Set(detection.detectedItems.map((item) => item.providerId))];
  const openProvider = (providerId: string) => openImportFlow(scope, {
    hostId: localHostId,
    items: detection.detectedItems,
    preselectedProviderIds: [providerId],
    source: "settings",
  });
  let content: unknown;
  if (isRunning) content = jsx.jsx(SettingRow, { label: "Import in progress", description: runningImport.items.map((item) => item.title).join(", "), control: jsx.jsx("span", { role: "status", children: "Importing…" }) });
  else if (detection.isDetecting) content = jsx.jsx(SettingRow, { label: "Checking for imports", description: "Looking for compatible setup, projects, and recent chats", control: jsx.jsx("span", { role: "status", children: "Loading…" }) });
  else if (detection.isDetectionError) content = jsx.jsx(SettingRow, { label: "Couldn't check for imports", description: "Try again to look for compatible setup, projects, and recent chats", control: jsx.jsx("button", { type: "button", onClick: detection.refetchDetectedItems, children: "Retry" }) });
  else if (providerIds.length === 0) content = jsx.jsx(SettingRow, {
    label: latestSuccessfulImportAtMs == null ? "Import from other AI apps" : "No new items found",
    description: latestSuccessfulImportAtMs == null ? "No importable setup found" : "Last imported " + new Date(latestSuccessfulImportAtMs).toISOString(),
    control: jsx.jsx("button", { type: "button", disabled: latestSuccessfulImportAtMs == null, onClick: detection.refetchDetectedItems, children: latestSuccessfulImportAtMs == null ? "Import" : "Check again" }),
  });
  else content = providerIds.map((providerId) => jsx.jsx(SettingRow, {
    label: providerLabel(providerId),
    control: jsx.jsx("button", { type: "button", "aria-label": "Import from " + providerLabel(providerId), onClick: () => openProvider(providerId), children: "Import" }),
  }, providerId));
  return jsx.jsx(Section, {
    title: "Import from another AI app",
    subtitle: providerIds.length === 0 ? undefined : "Detected setup that can be added to Codex",
    children: [
      content,
      !detection.isDetecting && !detection.isDetectionError && detection.unsupportedProjects.length > 0 ? jsx.jsx(SettingRow, {
        label: detection.unsupportedProjects.length + (detection.unsupportedProjects.length === 1 ? " project can't be imported" : " projects can't be imported"),
        description: detection.unsupportedProjects.map((project) => project.name).join(", ") + " use an unsupported project configuration",
      }) : null,
    ],
  });
}

function ImportHistorySection({ histories, isLoading, error, onRetry }: { histories: ImportHistory[]; isLoading: boolean; error: Error | null; onRetry(): void }): unknown {
  const [showAll, setShowAll] = React.useState(false);
  const visible = showAll ? histories : histories.slice(0, 3);
  if (!isLoading && error == null && histories.length === 0) return null;
  return jsx.jsx(Section, {
    title: "Import history",
    children: [
      ...visible.map((history) => {
        const imported = history.successes.length;
        const failed = history.failures.length;
        return jsx.jsxs("details", { children: [
          jsx.jsx("summary", { className: "cursor-pointer px-4 py-3", children: "Imported from " + providerLabel(history.providerId) + " · " + imported + " imported" + (failed > 0 ? " · " + failed + " did not import" : "") }),
          jsx.jsx("div", { className: "divide-y border-t", children: [
            ...history.successes.map((item, index) => jsx.jsx(SettingRow, { label: item.source ?? "Imported item", description: item.target ?? "Imported", control: item.itemType === "HOOKS" ? jsx.jsx("a", { href: buildHooksSettingsUrl({ hostId: localHostId }), children: "Open hooks settings" }) : null }, "success-" + index)),
            ...history.failures.map((item, index) => jsx.jsx(SettingRow, { label: item.source ?? "Imported item", description: item.message ?? "Import failed" }, "failure-" + index)),
          ] }),
        ] }, history.importId);
      }),
      histories.length > visible.length ? jsx.jsx("div", { className: "p-3 text-center", children: jsx.jsx("button", { type: "button", onClick: () => setShowAll(true), children: "View more" }) }) : null,
      isLoading ? jsx.jsx("div", { role: "status", className: "p-4", children: "Loading import history" }) : null,
      histories.length === 0 && error != null ? jsx.jsx(SettingRow, { label: "Couldn't load import history", description: error.message, control: jsx.jsx("button", { type: "button", onClick: onRetry, children: "Retry" }) }) : null,
    ],
  });
}

function AutomaticSync({ available }: { available: boolean }): unknown {
  const scope = useScope(AppScope);
  const enabled = useSetting(importSettings.syncEnabled);
  const itemTypes = useSetting(importSettings.syncItemTypes);
  const [error, setError] = React.useState(false);
  const toggle = (value: boolean) => {
    setError(false);
    void Promise.resolve(setSetting(scope, importSettings.syncEnabled, value)).catch(() => setError(true));
  };
  return jsx.jsx(Section, {
    title: "Automatic sync",
    children: [
      jsx.jsx(SettingRow, { label: "Keep imports in sync", description: enabled ? "Automatically sync new and updated content from connected sources" : "Sync paused. Your content selections are saved", control: jsx.jsx("button", { type: "button", role: "switch", "aria-label": "Keep imports in sync", "aria-checked": enabled, disabled: !available, onClick: () => toggle(!enabled), children: enabled ? "On" : "Off" }) }),
      jsx.jsx(SettingRow, { label: "Content to sync", description: available ? (itemTypes.length === 0 ? "No content selected" : itemTypes.join(", ")) : "Available after your first import", control: jsx.jsx("button", { type: "button", disabled: !available, children: "Customize" }) }),
      error ? jsx.jsx("div", { role: "alert", className: "px-4 py-3 text-danger", children: "Couldn’t change automatic sync. Try again" }) : null,
    ],
  });
}

function ImportSettings(): unknown {
  initializeImportSettings();
  const pageEnabled = useFeatureGate(importPageGate);
  const historyQuery = useScopedQuery<ImportHistory[]>(importHistoryQuery, localHostId);
  const histories = historyQuery.data ?? [];
  const latest = histories.find((history) => history.successes.length > 0)?.completedAtMs ?? null;
  return jsx.jsxs("div", { className: "flex h-full min-h-0 flex-col", children: [
    jsx.jsxs("header", { className: "border-b px-5 py-4", children: [jsx.jsx("h1", { className: "text-lg font-semibold", children: "Import" }), jsx.jsx("p", { className: "text-sm text-secondary", children: "Bring setup, projects, and chats from other AI apps into Codex" })] }),
    jsx.jsx("main", { className: "flex-1 overflow-auto p-5", children: pageEnabled ? jsx.jsxs("div", { className: "mx-auto flex max-w-3xl flex-col gap-5", children: [
      jsx.jsx(ImportSources, { latestSuccessfulImportAtMs: latest }),
      jsx.jsx(AutomaticSync, { available: histories.length > 0 }),
      jsx.jsx(ImportHistorySection, { histories, isLoading: historyQuery.isLoading, error: historyQuery.error, onRetry: historyQuery.refetch }),
    ] }) : jsx.jsx("div", { role: "status", children: "Import settings are not available" }) }),
  ] });
}

let initialized = false;
function initializeImportSettings(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeHooksSettingsRoute();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeImportSettings();
export { ImportSettings };
