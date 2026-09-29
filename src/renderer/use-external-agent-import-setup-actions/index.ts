// Imported setup UI and actions shared by onboarding and Import settings.

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as tabsChunk from "@rchunk/tabs";
import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as appConnectFlowChunk from "@rchunk/use-app-connect-flow";
import * as hooksSettingsRouteChunk from "@rchunk/hooks-settings-route";
import * as ambientSuggestionsChunk from "@rchunk/first-app-connect-ambient-suggestions";
import * as appCardChunk from "@rchunk/app-card";

type SetupTab = "apps" | "mcps" | "hooks";
type SetupStatus = "ready" | "loading" | "error";
type StateUpdater<Value> = Value | ((current: Value) => Value);
interface Ref<Value> { current: Value }
interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useEffectEvent?(callback: () => void): () => void;
  useRef<Value>(initialValue: Value): Ref<Value>;
  useState<Value>(initialValue: Value | (() => Value)): [Value, (next: StateUpdater<Value>) => void];
}
interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: object, key?: string): unknown;
  jsxs(type: unknown, props: object, key?: string): unknown;
}
interface QueryClient { invalidateQueries(options: { queryKey: unknown[] }): void }
interface Scope { get?(signal: unknown): unknown }
interface AppRecord { id: string; description?: string | null; isAccessible?: boolean; isEnabled?: boolean }
interface PluginRecord { plugin: { id: string }; [key: string]: unknown }
interface ImportedPlugin { app: AppRecord; plugin: PluginRecord }
interface PendingApp { app: AppRecord; installed: boolean; pluginId: string | null }
interface McpCompletion { hostId?: string; name: string; success: boolean }
interface ConnectFlowResult {
  clearConnectingApp(): void;
  connectingApp: AppRecord | null;
  handleAppConnectOAuthStarted(...arguments_: unknown[]): void;
  handleConnectApp(app: AppRecord): void | Promise<void>;
  isAppConnectPending(appId: string): boolean;
}
interface SetupActionsOptions {
  hardRefetchAppsList(): Promise<unknown> | unknown;
  hasImportedMcpServers: boolean;
  hostId: string;
  onBeforeNavigate?(): void;
  retryImportHistories(): void;
  retryImportedApps(): void;
  retryMcpServerStatuses(): void;
  surface?: string;
}
interface SetupActions {
  clearConnectingApp(): void;
  connectedApps: AppRecord[];
  connectingApp: AppRecord | null;
  handleAppConnectOAuthStarted(...arguments_: unknown[]): void;
  handleAppConnected(): Promise<void>;
  handleAuthenticateMcp(serverName: string): Promise<void>;
  handleConnectApp(app: AppRecord): void | Promise<void>;
  handleInstallPlugin(plugin: PluginRecord, app: AppRecord): void;
  handleOpenHooksSettings(): void;
  handleOpenImportSettings(): void;
  handleRetry(tab: SetupTab): void;
  isAppConnectPending(appId: string): boolean;
}
interface SetupContentProps {
  appsRequiringConnection: AppRecord[];
  connectedApps: AppRecord[];
  hasImportedHooks: boolean;
  importedPlugins: ImportedPlugin[];
  isAppConnectPending(appId: string): boolean;
  mcpServerNamesRequiringAuthentication: string[];
  selectedTab: SetupTab;
  tabStatus: Record<SetupTab, SetupStatus>;
  variant?: "dialog" | "settings" | "onboarding" | "conversational";
  onAllItemsComplete?: () => void;
  onConnectApp(app: AppRecord): void;
  onInstallPlugin(plugin: PluginRecord, app: AppRecord): void;
  onOpenHooksSettings(): void;
  onAuthenticateMcp(name: string): void;
  onRetry(tab: SetupTab): void;
  onSelectTab(tab: SetupTab): void;
}

const shared = appSharedChunk as unknown as {
  $3?: () => void;
  BX?: <Data>(query: unknown, parameter: unknown, options: { enabled: boolean }) => { data?: Data };
  CL?: () => QueryClient;
  HX?: <Value>(signal: unknown) => Value;
  I3: () => JsxRuntime;
  LX?: (scope: unknown) => Scope;
  Q3?: { error(message: string, context: unknown): void };
  QI?: () => (destination: unknown) => void;
  Y2?: (props: Record<string, unknown>) => unknown;
  ZI?: unknown;
  cN?: Record<string, string>;
  e6: () => ReactRuntime;
  pN?: Record<string, string>;
};
const initial = appInitialChunk as unknown as {
  $Zt?: unknown;
  MEt?: unknown;
  U2?: () => { installPlugin(plugin: PluginRecord, options: Record<string, unknown>): boolean | void; status?: { hostId?: string; pluginId?: string } };
  Ugn?: (scope: Scope, hostId: string) => { sendRequest(method: string, payload: Record<string, unknown>): Promise<{ authorizationUrl?: string | null }> };
  Wv?: (scope: Scope, hostId: string) => void;
  kft?: (target: { href: string; initiator: string; openTarget: string }) => void;
  qsn?: unknown[];
  ta?: unknown;
  xpn?: (...arguments_: unknown[]) => void;
};
const tabs = tabsChunk as unknown as { n?: () => void; t?: (props: Record<string, unknown>) => unknown };
const connectModal = appConnectModalChunk as unknown as { l?: (props: Record<string, unknown>) => unknown; u?: () => void };
const connectFlow = appConnectFlowChunk as unknown as { n?: (options: { hostId: string; onConnectStarted(app: AppRecord): void }) => ConnectFlowResult; t?: () => void };
const hooksRoute = hooksSettingsRouteChunk as unknown as { r?: () => void; t?: (options: { hostId: string }) => unknown };
const ambientSuggestions = ambientSuggestionsChunk as unknown as { n?: (options: { hostId: string; queryClient: QueryClient; refreshAppsList(): Promise<unknown> | unknown }) => Promise<void>; t?: () => void };
const appCard = appCardChunk as unknown as { n?: () => void; t?: (props: Record<string, unknown>) => unknown };

const { $3: initializeSharedRuntime, BX: useScopedQuery, CL: useQueryClient, HX: useSignalValue, I3: getJsxRuntime, LX: useScope, Q3: logger, QI: useNavigate, Y2: FormattedMessage, ZI: applicationScope, cN: marketplaceSurfaces, e6: getReactRuntime, pN: marketplaceSources } = shared;
const { $Zt: mcpOAuthCompletionSignal, MEt: connectedAppsQuery, U2: usePluginInstaller, Ugn: getHostBridge, Wv: recordNavigation, kft: openExternalLink, qsn: mcpServerStatusQueryKey, ta: importSettingsDestination, xpn: trackConnectorSetup } = initial;
const { n: initializeTabs, t: Tabs } = tabs;
const { l: ScrollArea, u: initializeConnectModal } = connectModal;
const { n: useAppConnectFlow, t: initializeConnectFlow } = connectFlow;
const { r: initializeHooksRoute, t: createHooksSettingsDestination } = hooksRoute;
const { n: refreshConnectedApps, t: initializeAmbientSuggestions } = ambientSuggestions;
const { n: initializeAppCard, t: AppCard } = appCard;

let jsx: JsxRuntime;
let React: ReactRuntime;
let uiInitialized = false;
let actionsInitialized = false;

function initializeExternalAgentImportSetupUi(): void {
  if (uiInitialized) return;
  initializeSharedRuntime?.();
  initializeConnectModal?.();
  initializeTabs?.();
  initializeAppCard?.();
  jsx = getJsxRuntime();
  React = getReactRuntime();
  uiInitialized = true;
}

function initializeExternalAgentImportSetupActions(): void {
  if (actionsInitialized) return;
  initializeSharedRuntime?.();
  initializeConnectFlow?.();
  initializeHooksRoute?.();
  initializeAmbientSuggestions?.();
  jsx = getJsxRuntime();
  React = getReactRuntime();
  actionsInitialized = true;
}

function getSetupCounts(appsRequiringConnection: AppRecord[], connectedApps: AppRecord[], hasImportedHooks: boolean, importedPlugins: ImportedPlugin[], mcpServerNames: string[]): Record<SetupTab, number> {
  const connectedIds = new Set(connectedApps.map(({ id }) => id));
  const plugins = importedPlugins.filter(({ app }) => !connectedIds.has(app.id)).length;
  const apps = appsRequiringConnection.filter(({ id }) => !connectedIds.has(id)).length;
  return { apps: plugins + apps + connectedApps.length, hooks: Number(hasImportedHooks), mcps: mcpServerNames.length };
}

function ImportedSetupSummary(props: Omit<SetupContentProps, "isAppConnectPending" | "selectedTab" | "onConnectApp" | "onInstallPlugin" | "onOpenHooksSettings" | "onAuthenticateMcp" | "onRetry" | "onSelectTab"> & { onOpenSettings?: () => void }): unknown {
  initializeExternalAgentImportSetupUi();
  const counts = getSetupCounts(props.appsRequiringConnection, props.connectedApps, props.hasImportedHooks, props.importedPlugins, props.mcpServerNamesRequiringAuthentication);
  const order: SetupTab[] = props.variant === "onboarding" || props.variant === "conversational" ? ["apps", "mcps"] : ["apps", "mcps", "hooks"];
  const categories = order.filter((tab) => tab === "mcps" ? counts[tab] > 0 : counts[tab] > 0 || props.tabStatus[tab] !== "ready").join("_");
  return jsx.jsx(FormattedMessage ?? "span", { id: "externalAgentImport.setup.subtitle.v3", defaultMessage: "Finish setting up the tools you imported", values: { categories, settingsAvailable: props.onOpenSettings == null ? "false" : "true", settings: (children: unknown) => jsx.jsx("button", { type: "button", onClick: props.onOpenSettings, children }, "settings") } });
}

function ImportedSetupContent(props: SetupContentProps): unknown {
  initializeExternalAgentImportSetupUi();
  const counts = getSetupCounts(props.appsRequiringConnection, props.connectedApps, props.hasImportedHooks, props.importedPlugins, props.mcpServerNamesRequiringAuthentication);
  const order: SetupTab[] = props.variant === "onboarding" || props.variant === "conversational" ? ["apps", "mcps"] : ["apps", "mcps", "hooks"];
  const visible = order.filter((tab) => tab === "mcps" ? counts.mcps > 0 : counts[tab] > 0 || props.tabStatus[tab] !== "ready");
  const active = visible.includes(props.selectedTab) ? props.selectedTab : visible[0];
  const complete = props.onAllItemsComplete != null && visible.length === 0 && props.connectedApps.every((app) => app.isAccessible && app.isEnabled && !props.isAppConnectPending(app.id));
  const completeEvent = React.useEffectEvent?.(() => props.onAllItemsComplete?.()) ?? (() => props.onAllItemsComplete?.());
  React.useEffect(() => { if (complete) completeEvent(); }, [complete]);
  if (active == null) return null;
  const definitions = visible.map((tab) => ({ key: tab, name: tab, panelId: "external-agent-import-setup-" + tab + "-panel" }));
  const panels = visible.map((tab) => jsx.jsx("div", { id: "external-agent-import-setup-" + tab + "-panel", role: "tabpanel", tabIndex: tab === active ? 0 : -1, "aria-hidden": tab === active ? undefined : true, children: createPanel(tab, props, counts[tab]) }, tab));
  return jsx.jsxs(jsx.Fragment, { children: [jsx.jsx(Tabs ?? "div", { selectedKey: active, tabs: definitions, onSelect: props.onSelectTab }), jsx.jsx("div", { className: "flex min-h-0 flex-1 flex-col pt-3", children: panels })] });
}

function createPanel(tab: SetupTab, props: SetupContentProps, count: number): unknown {
  if (count === 0) return jsx.jsx("div", { role: props.tabStatus[tab] === "error" ? "alert" : undefined, "data-status": props.tabStatus[tab], onClick: props.tabStatus[tab] === "error" ? () => props.onRetry(tab) : undefined, children: props.tabStatus[tab] });
  if (tab === "mcps") return jsx.jsx(jsx.Fragment, { children: props.mcpServerNamesRequiringAuthentication.map((name) => jsx.jsx("button", { onClick: () => props.onAuthenticateMcp(name), children: name }, name)) });
  if (tab === "hooks") return jsx.jsx("button", { onClick: props.onOpenHooksSettings, children: "Imported hooks" });
  const plugins = props.importedPlugins.map(({ app, plugin }) => jsx.jsx(AppCard ?? "button", { app, onInstallApp: () => props.onInstallPlugin(plugin, app) }, "plugin:" + plugin.plugin.id));
  const apps = [...props.appsRequiringConnection, ...props.connectedApps].map((app) => jsx.jsx(AppCard ?? "button", { app, isConnectingApp: props.isAppConnectPending(app.id), onInstallApp: () => props.onConnectApp(app) }, "app:" + app.id));
  return jsx.jsx(jsx.Fragment, { children: [...plugins, ...apps] });
}

function ExternalAgentImportSetupDialog(props: SetupContentProps & { open: boolean; onOpenChange(open: boolean): void; onOpenSettings?: () => void; onShown?: () => void }): unknown {
  initializeExternalAgentImportSetupUi();
  const content = jsx.jsxs("div", { className: "overflow-hidden select-none", children: [jsx.jsx(ImportedSetupSummary, props), jsx.jsx(ImportedSetupContent, props)] });
  return jsx.jsx("dialog", { open: props.open, "aria-label": "Close imported setup", onClose: () => props.onOpenChange(false), onFocus: props.onShown, children: ScrollArea == null ? content : jsx.jsx(ScrollArea, { children: content }) });
}

function useExternalAgentImportSetupActions(options: SetupActionsOptions): SetupActions {
  initializeExternalAgentImportSetupActions();
  const surface = options.surface ?? marketplaceSurfaces?.CODEX_PLUGIN_MARKETPLACE_SURFACE_CONNECTOR_SETUP ?? "connector_setup";
  const scope = useScope?.(applicationScope) ?? {};
  const navigate = useNavigate?.() ?? (() => undefined);
  const queryClient = useQueryClient?.() ?? { invalidateQueries: () => undefined };
  const installer = usePluginInstaller?.() ?? { installPlugin: () => undefined, status: undefined };
  const completion = useSignalValue?.<McpCompletion | null>(mcpOAuthCompletionSignal) ?? null;
  const connectedQuery = useScopedQuery?.<AppRecord[]>(connectedAppsQuery, options.hostId, { enabled: false });
  const authorizationUrls = React.useRef(new Map<string, string | null>());
  const skipInitialCompletion = React.useRef(true);
  const [pendingApps, setPendingApps] = React.useState<PendingApp[]>([]);
  const addPending = (app: AppRecord, pluginId: string | null) => setPendingApps((current) => current.some(({ app: existing }) => existing.id === app.id) ? current : [...current, { app, installed: false, pluginId }]);
  const flow = useAppConnectFlow?.({ hostId: options.hostId, onConnectStarted(app) { addPending(app, null); trackConnectorSetup?.(scope, options.hostId, { connectorId: app.id, source: marketplaceSources?.CODEX_PLUGIN_SOURCE_EXTERNAL_AGENT_IMPORT, surface }); } }) ?? { clearConnectingApp: () => undefined, connectingApp: null, handleAppConnectOAuthStarted: () => undefined, handleConnectApp: () => undefined, isAppConnectPending: () => false };
  const handleRetry = (tab: SetupTab) => { if (tab === "apps") options.retryImportedApps(); else { options.retryImportHistories(); if (tab === "mcps" && options.hasImportedMcpServers) options.retryMcpServerStatuses(); } };
  const go = (destination: unknown) => { recordNavigation?.(scope, options.hostId); options.onBeforeNavigate?.(); navigate(destination); };
  const handleAuthenticateMcp = async (serverName: string) => {
    const cached = authorizationUrls.current.get(serverName);
    if (cached !== undefined) { if (cached != null) openExternalLink?.({ href: cached, initiator: "open_in_browser_bridge", openTarget: "external-browser" }); return; }
    authorizationUrls.current.set(serverName, null);
    try {
      const response = await getHostBridge?.(scope, options.hostId).sendRequest("mcpServer/oauth/login", { name: serverName });
      if (response?.authorizationUrl != null) { authorizationUrls.current.set(serverName, response.authorizationUrl); openExternalLink?.({ href: response.authorizationUrl, initiator: "open_in_browser_bridge", openTarget: "external-browser" }); }
    } catch (error) {
      authorizationUrls.current.delete(serverName);
      logger?.error("Failed to start login for imported MCP server", { safe: { hostId: options.hostId }, sensitive: { error, serverName } });
    }
  };
  const processCompletion = () => {
    if (completion == null || !authorizationUrls.current.has(completion.name)) return;
    const url = authorizationUrls.current.get(completion.name);
    if (completion.success || url == null) authorizationUrls.current.delete(completion.name);
    if (completion.success) queryClient.invalidateQueries({ queryKey: [...(mcpServerStatusQueryKey ?? []), options.hostId] });
  };
  const completionEvent = React.useEffectEvent?.(processCompletion) ?? processCompletion;
  React.useEffect(() => { if (skipInitialCompletion.current) { skipInitialCompletion.current = false; return; } if (completion?.hostId === options.hostId) completionEvent(); }, [options.hostId, completion]);
  const connectedApps = pendingApps.flatMap(({ app, installed, pluginId }) => {
    if (pluginId != null && !installed) return [];
    const connected = connectedQuery?.data?.find(({ id, isAccessible }) => id === app.id && isAccessible);
    return connected == null ? [] : [connected];
  });
  const handleInstallPlugin = (plugin: PluginRecord, app: AppRecord) => {
    if (installer.status?.hostId === options.hostId && installer.status.pluginId === plugin.plugin.id) return;
    addPending(app, plugin.plugin.id);
    const started = installer.installPlugin(plugin, { hostId: options.hostId, marketplaceAnalytics: { source: marketplaceSources?.CODEX_PLUGIN_SOURCE_EXTERNAL_AGENT_IMPORT, surface }, onSuccess: () => setPendingApps((current) => current.map((entry) => entry.app.id === app.id && entry.pluginId === plugin.plugin.id ? { ...entry, installed: true } : entry)), source: marketplaceSources?.CODEX_PLUGIN_SOURCE_EXTERNAL_AGENT_IMPORT });
    if (!started) setPendingApps((current) => current.filter(({ app: pending }) => pending.id !== app.id));
  };
  const isAppConnectPending = (appId: string) => flow.isAppConnectPending(appId) || pendingApps.some(({ app, pluginId }) => app.id === appId && pluginId != null && installer.status?.hostId === options.hostId && installer.status.pluginId === pluginId);
  return {
    clearConnectingApp: flow.clearConnectingApp,
    connectedApps,
    connectingApp: flow.connectingApp,
    handleAppConnectOAuthStarted: flow.handleAppConnectOAuthStarted,
    handleAppConnected: async () => { try { await refreshConnectedApps?.({ hostId: options.hostId, queryClient, refreshAppsList: options.hardRefetchAppsList }); } catch { return; } },
    handleAuthenticateMcp,
    handleConnectApp: flow.handleConnectApp,
    handleInstallPlugin,
    handleOpenHooksSettings: () => go(createHooksSettingsDestination?.({ hostId: options.hostId })),
    handleOpenImportSettings: () => go(importSettingsDestination),
    handleRetry,
    isAppConnectPending,
  };
}

initializeExternalAgentImportSetupActions();

export { ImportedSetupSummary as a, ExternalAgentImportSetupDialog as i, useExternalAgentImportSetupActions as n, initializeExternalAgentImportSetupUi as o, ImportedSetupContent as r, initializeExternalAgentImportSetupActions as t };
