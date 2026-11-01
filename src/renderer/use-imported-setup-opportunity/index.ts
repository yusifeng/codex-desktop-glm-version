// Imported setup opportunity and onboarding task projection.
//
// The release chunk bundled several onboarding helpers into one aggregation
// boundary.  This source keeps the independently owned behavior readable:
// checklist snapshots, plugin prompt projection, import-history correlation,
// and the Apps/MCP/Hooks setup state presented after an external-agent import.

// Preserve the release aggregation boundary's audited loader/cache edges. The
// product behavior below is local; these imports only keep chunk registration
// and lazy surfaces in the same order as the published application.
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/onboarding-mail-provider";
import "@rchunk/conversation-blocks";
import "@rchunk/thread-bridge";
import "@rchunk/remote-hosted-pip-anchor-bridge";
import "@rchunk/agent-activity-item";
import "@rchunk/mcp-tool-item-content";
import "@rchunk/local-conversation-turn";
import "@rchunk/mcp-tool-approval-message";
import "@exact-chunk/BarChart-2010e7d67e4a.js";
import "@rchunk/computer-use-app-approval-request-card";
import "@rchunk/folder-light-icon";
import "@rchunk/sidebar-onboarding-checklist-task-config";
import "@rchunk/plugin-setup";
import "@rchunk/shuffle";
import "@rchunk/bar-chart-icon";
import "@rchunk/visualization-standalone-document";
import "@exact-chunk/visualization-directive-renderer-59d128f8ff01.js";
import "@rchunk/external-agent-import-setup";

type SetupTab = "apps" | "mcps" | "hooks";
type SetupStatus = "ready" | "loading" | "error";

interface IntlShape {
  formatMessage(message: unknown, values?: Record<string, unknown>): string;
}

interface PluginMention {
  label: string;
  pluginId: string;
}

interface TaskDefinition {
  instructions?: string;
  is_auto_submit_enabled?: boolean;
  label?: unknown;
  localized?: Record<string, { label?: unknown; prompt?: unknown }>;
  origin?: "checked_in" | "remote" | string;
  pluginSlots?: Record<string, string>;
  prependPluginMentions?: boolean;
  prompt?: unknown;
}

interface StoredChecklistItem {
  id: string;
  snapshot?: ChecklistSnapshot | null;
  [key: string]: unknown;
}

interface ChecklistSnapshot {
  instructions?: string;
  label?: string;
  pluginSlots?: Record<string, string>;
  prependPluginMentions?: boolean;
  prompt?: unknown;
  type: "sidebar" | "sidebar_project" | "sidebar_claude_import" | "sidebar_notification";
}

interface ProjectedChecklistItem {
  action: "create_project" | "enable_notifications" | "import_claude" | "start_prompt";
  id: string;
  instructions?: string;
  isAutoSubmitEnabled?: boolean;
  message: unknown;
  pluginMentions?: PluginMention[];
  pluginSlots?: Record<string, string>;
  prependPluginMentions?: boolean;
  prompt?: unknown;
  promptValues?: Record<string, string>;
}

interface ImportSuccess {
  itemType: string;
  source?: string | null;
  target?: string | null;
  title?: string | null;
}

interface ImportHistory {
  completedAtMs: number | string;
  providerId?: string | null;
  successes: ImportSuccess[];
}

interface ImportedApp {
  id: string;
  name: string;
  pluginDisplayNames: string[];
}

interface ImportedPlugin {
  app: ImportedApp;
  displayName?: string | null;
  plugin: {
    displayName?: string | null;
    plugin: { id: string; interface?: { displayName?: string | null }; name?: string | null };
  };
}

interface Connector {
  codexAppId?: string | null;
  importedAtMs?: number;
  name: string;
  source?: string;
}

interface McpServerStatus {
  name: string;
  requiresAuthentication?: boolean;
  status?: string;
}

interface ImportSetupInput {
  allowUnknownProviderNames?: boolean;
  appsError?: unknown;
  appsLoading?: boolean;
  appsRequiringConnection?: ImportedApp[];
  connectors?: Connector[];
  foregroundImport?: { providerIds: string[]; startedAtMs: number } | null;
  histories?: ImportHistory[];
  historiesError?: unknown;
  historiesLoading?: boolean;
  importedPlugins?: ImportedPlugin[];
  mcpServerStatuses?: McpServerStatus[];
  mcpStatusesError?: unknown;
  mcpStatusesLoading?: boolean;
}

const CREATE_PROJECT_ITEM: ProjectedChecklistItem = {
  action: "create_project",
  id: "create_project",
  message: "Create a project",
};
const IMPORT_CLAUDE_ITEM: ProjectedChecklistItem = {
  action: "import_claude",
  id: "claude_import",
  message: "Import from Claude",
};
const ENABLE_NOTIFICATIONS_ITEM: ProjectedChecklistItem = {
  action: "enable_notifications",
  id: "enable_notifications",
  message: "Enable notifications",
};
const DEFAULT_TASK_IDS = ["desktop_note", "csv_chart"];
const MAX_VISIBLE_TASKS = 8;

let initialized = false;

function initializeImportedSetupOpportunity(): void {
  if (initialized) return;
  initialized = true;
}

function localizedField(definition: TaskDefinition, field: "label" | "prompt", locale: string): unknown {
  return definition.localized?.[locale]?.[field] ?? definition.localized?.[locale.split("-")[0]]?.[field] ?? definition[field];
}

function resolveImportedSetupLabel(item: { message?: unknown }, intl: IntlShape): string {
  if (typeof item.message === "string") return item.message;
  if (item.message == null) return "";
  return intl.formatMessage(item.message);
}

function replacePromptValues(prompt: string, values?: Record<string, string>): string {
  let result = prompt;
  for (const [key, value] of Object.entries(values ?? {})) result = result.replaceAll(`{${key}}`, value);
  return result;
}

function formatPrompt(item: { prompt?: unknown }, intl: IntlShape, values?: Record<string, string>): string {
  if (typeof item.prompt === "string") return replacePromptValues(item.prompt, values);
  return item.prompt == null ? "" : intl.formatMessage(item.prompt, values);
}

function stripPluginVersion(pluginId: string): string {
  const index = pluginId.lastIndexOf("@");
  return index > 0 ? pluginId.slice(0, index) : pluginId;
}

function humanizePluginName(name: string): string {
  return name === "chatgpt-for-finance"
    ? "ChatGPT Financial Services"
    : name.split(/[-_]/g).filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

function createPluginMention(pluginId: string): PluginMention {
  const name = stripPluginVersion(pluginId);
  return { label: `@${humanizePluginName(name)}`, pluginId: pluginId.includes("@") ? pluginId : `${pluginId}@latest` };
}

function renderPluginMention(mention: PluginMention): string {
  return mention.label;
}

function promptWithMentions(item: ProjectedChecklistItem, intl: IntlShape): string {
  const prompt = formatPrompt(item, intl, item.promptValues);
  return item.prependPluginMentions && item.pluginMentions?.length
    ? `${item.pluginMentions.map(renderPluginMention).join(" ")} ${prompt}`
    : prompt;
}

function resolveInstructions(item: ProjectedChecklistItem): string | undefined {
  return item.instructions == null ? undefined : replacePromptValues(item.instructions, item.promptValues);
}

function projectImportedSetupItems({
  items,
  locale,
  taskDefinitions,
}: {
  items: StoredChecklistItem[];
  locale: string;
  mailProvider?: unknown;
  plan?: unknown;
  representativeRole?: string | null;
  taskDefinitions: Record<string, TaskDefinition>;
}): ProjectedChecklistItem[] {
  const projected: ProjectedChecklistItem[] = [];
  for (const stored of items) {
    if (stored.id === "create_project") {
      projected.push({ ...CREATE_PROJECT_ITEM, message: stored.snapshot?.type === "sidebar_project" ? stored.snapshot.label ?? CREATE_PROJECT_ITEM.message : CREATE_PROJECT_ITEM.message });
      continue;
    }
    if (stored.id === "claude_import") {
      projected.push({ ...IMPORT_CLAUDE_ITEM, message: stored.snapshot?.type === "sidebar_claude_import" ? stored.snapshot.label ?? IMPORT_CLAUDE_ITEM.message : IMPORT_CLAUDE_ITEM.message });
      continue;
    }
    if (stored.id === "enable_notifications") {
      projected.push({ ...ENABLE_NOTIFICATIONS_ITEM, message: stored.snapshot?.type === "sidebar_notification" ? stored.snapshot.label ?? ENABLE_NOTIFICATIONS_ITEM.message : ENABLE_NOTIFICATIONS_ITEM.message });
      continue;
    }
    const definition = taskDefinitions[stored.id];
    const snapshot = stored.snapshot?.type === "sidebar" ? stored.snapshot : null;
    if (definition == null && snapshot == null) continue;
    const pluginSlots = snapshot?.pluginSlots ?? definition?.pluginSlots;
    const promptValues: Record<string, string> = {};
    const pluginMentions: PluginMention[] = [];
    for (const [slot, pluginId] of Object.entries(pluginSlots ?? {})) {
      const mention = createPluginMention(pluginId);
      pluginMentions.push(mention);
      promptValues[slot] = renderPluginMention(mention);
    }
    projected.push({
      action: "start_prompt",
      id: stored.id,
      instructions: snapshot?.instructions ?? (definition?.origin === "remote" ? definition.instructions : undefined),
      isAutoSubmitEnabled: definition?.origin === "remote" ? definition.is_auto_submit_enabled : undefined,
      message: snapshot?.label ?? localizedField(definition ?? {}, "label", locale) ?? stored.id.replaceAll("_", " "),
      pluginMentions: pluginMentions.length ? pluginMentions : undefined,
      pluginSlots,
      prependPluginMentions: snapshot?.prependPluginMentions ?? definition?.prependPluginMentions ?? false,
      prompt: snapshot?.prompt ?? localizedField(definition ?? {}, "prompt", locale) ?? "",
      promptValues: Object.keys(promptValues).length ? promptValues : undefined,
    });
  }
  return projected;
}

function createChecklistSnapshot(item: ProjectedChecklistItem, intl: IntlShape): ChecklistSnapshot {
  if (item.action === "create_project") return { type: "sidebar_project", label: resolveImportedSetupLabel(item, intl) };
  if (item.action === "import_claude") return { type: "sidebar_claude_import", label: resolveImportedSetupLabel(item, intl) };
  if (item.action === "enable_notifications") return { type: "sidebar_notification", label: resolveImportedSetupLabel(item, intl) };
  const placeholders = item.pluginSlots == null ? undefined : Object.fromEntries(Object.keys(item.pluginSlots).map((key) => [key, `{${key}}`]));
  return {
    type: "sidebar",
    instructions: item.instructions,
    label: resolveImportedSetupLabel(item, intl),
    pluginSlots: item.pluginSlots,
    prependPluginMentions: item.prependPluginMentions || undefined,
    prompt: typeof item.prompt === "string" ? replacePromptValues(item.prompt, placeholders) : item.prompt,
  };
}

function foregroundHistories(histories: ImportHistory[], foreground?: ImportSetupInput["foregroundImport"]): ImportHistory[] {
  if (foreground == null) return histories;
  return histories.filter((history) => Number(history.completedAtMs) >= foreground.startedAtMs && (history.providerId == null || foreground.providerIds.includes(history.providerId)));
}

function hasImportItem(history: ImportHistory, itemType: string): boolean {
  return history.successes.some((success) => success.itemType === itemType);
}

function hasImportedConnectorSetup(histories: ImportHistory[], connectors: Connector[] = []): boolean {
  return connectors.length > 0 || histories.some((history) => history.successes.some((success) => success.itemType === "MCP_SERVER_CONFIG" || success.itemType === "PLUGINS"));
}

function hasImportedMcpServers(histories: ImportHistory[]): boolean {
  return histories.some((history) => hasImportItem(history, "MCP_SERVER_CONFIG"));
}

function hasImportedHooks(histories: ImportHistory[]): boolean {
  return histories.some((history) => history.successes.some((success) => success.itemType === "HOOKS" || success.itemType === "HOOK_CONFIG"));
}

function hasImportedSessions(histories: ImportHistory[]): boolean {
  return histories.some((history) => hasImportItem(history, "SESSIONS"));
}

function normalizeImportName(value: string): string {
  return value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "");
}

function filterImportedApps({
  allowUnknownProviderNames = false,
  appsRequiringConnection = [],
  connectors = [],
  histories = [],
  importedPlugins = [],
}: Pick<ImportSetupInput, "allowUnknownProviderNames" | "appsRequiringConnection" | "connectors" | "histories" | "importedPlugins">): {
  appsRequiringConnection: ImportedApp[];
  importedPlugins: ImportedPlugin[];
} {
  const importedNames = new Set<string>();
  for (const history of histories) {
    if (history.providerId === "claude-cowork" || (!allowUnknownProviderNames && history.providerId == null)) continue;
    for (const success of history.successes) {
      if (success.itemType !== "MCP_SERVER_CONFIG" && success.itemType !== "PLUGINS") continue;
      for (const value of [success.source, success.target, success.title]) {
        if (value == null) continue;
        importedNames.add(normalizeImportName(value));
        importedNames.add(normalizeImportName(value.split("@")[0] ?? value));
      }
    }
  }
  for (const connector of connectors) {
    importedNames.add(normalizeImportName(connector.name));
    if (connector.codexAppId != null) importedNames.add(normalizeImportName(connector.codexAppId));
  }
  const matches = (...values: Array<string | null | undefined>) => values.some((value) => value != null && importedNames.has(normalizeImportName(value)));
  return {
    appsRequiringConnection: appsRequiringConnection.filter((app) => matches(app.id, app.name, ...app.pluginDisplayNames)),
    importedPlugins: importedPlugins.filter(({ app, plugin }) => matches(app.id, app.name, ...app.pluginDisplayNames, plugin.plugin.id, plugin.plugin.name, plugin.plugin.interface?.displayName, plugin.displayName)),
  };
}

function mcpServerNamesRequiringAuthentication(statuses: McpServerStatus[]): string[] {
  return statuses.filter((status) => status.requiresAuthentication === true || status.status === "authentication_required").map((status) => status.name);
}

function statusFrom(error: unknown, loading: boolean): SetupStatus {
  return loading ? "loading" : error == null ? "ready" : "error";
}

function deriveImportedSetupOpportunity(input: ImportSetupInput) {
  const histories = foregroundHistories(input.histories ?? [], input.foregroundImport);
  const connectors = input.connectors ?? [];
  const filtered = filterImportedApps({
    allowUnknownProviderNames: input.allowUnknownProviderNames ?? input.foregroundImport?.providerIds.some((provider) => provider !== "claude-cowork") ?? false,
    appsRequiringConnection: input.appsRequiringConnection,
    connectors,
    histories,
    importedPlugins: input.importedPlugins,
  });
  const mcpNames = mcpServerNamesRequiringAuthentication(input.mcpServerStatuses ?? []);
  const importedMcp = hasImportedMcpServers(histories);
  const importedHooks = hasImportedHooks(histories);
  const connectorSetup = hasImportedConnectorSetup(histories, connectors);
  const tabStatus: Record<SetupTab, SetupStatus> = {
    apps: statusFrom(input.appsError, input.appsLoading === true),
    hooks: statusFrom(input.historiesError, input.historiesLoading === true),
    mcps: statusFrom(input.mcpStatusesError, importedMcp && input.mcpStatusesLoading === true),
  };
  const isLoading = Object.values(tabStatus).includes("loading");
  const initialTab: SetupTab | null = isLoading
    ? null
    : filtered.appsRequiringConnection.length > 0 || filtered.importedPlugins.length > 0 || tabStatus.apps === "error"
      ? "apps"
      : mcpNames.length > 0 || tabStatus.mcps === "error"
        ? "mcps"
        : importedHooks || tabStatus.hooks === "error"
          ? "hooks"
          : null;
  return {
    ...filtered,
    hasImportedConnectorSetup: connectorSetup,
    hasImportedHooks: importedHooks,
    hasImportedMcpServers: importedMcp,
    histories,
    initialTab,
    isLoading,
    mcpServerNamesRequiringAuthentication: mcpNames,
    tabStatus,
  };
}

function useImportedSetupOpportunity(input: ImportSetupInput) {
  initializeImportedSetupOpportunity();
  return deriveImportedSetupOpportunity(input);
}

function collectRemotePluginIds({ items, remotePluginIdsByName: idsByName = {}, additionalPluginNames: additionalNames = [] }: {
  additionalPluginNames?: string[];
  items: ProjectedChecklistItem[];
  remotePluginIdsByName?: Record<string, string>;
}): Map<string, string> {
  const result = new Map<string, string>();
  for (const item of items) for (const mention of item.pluginMentions ?? []) {
    const id = idsByName[mention.pluginId] ?? idsByName[stripPluginVersion(mention.pluginId)];
    if (id != null) result.set(mention.pluginId, id);
  }
  for (const name of additionalNames) if (idsByName[name] != null) result.set(`${name}@latest`, idsByName[name]);
  return result;
}

function filterDisabledRemotePlugins({ items, remotePluginIds: remoteIds, disabledRemotePluginIds: disabledIds, enabled = true }: {
  disabledRemotePluginIds: Set<string>;
  enabled?: boolean;
  items: ProjectedChecklistItem[];
  remotePluginIds: Map<string, string>;
}): ProjectedChecklistItem[] {
  if (!enabled) return items;
  return items.filter((item) => !item.pluginMentions?.some((mention) => disabledIds.has(remoteIds.get(mention.pluginId) ?? "")));
}

function primaryPluginName(item: ProjectedChecklistItem): string | null {
  return item.pluginMentions?.length === 1 ? stripPluginVersion(item.pluginMentions[0].pluginId) : null;
}

function chooseVisibleTaskIds(candidateIds: string[], declinedIds: string[] = [], minimum = 2): string[] {
  const declined = new Set(declinedIds);
  const result = candidateIds.filter((id) => !declined.has(id)).slice(0, MAX_VISIBLE_TASKS);
  for (const id of DEFAULT_TASK_IDS) if (result.length < minimum && !result.includes(id)) result.push(id);
  return result;
}

function taskEntry(entries: Map<string, unknown>, taskId: string): unknown | null {
  return entries.get(taskId) ?? null;
}

function selectTaskEntry(entries: Map<string, unknown>, taskId: string): { entry: unknown; taskId: string } {
  const entry = taskEntry(entries, taskId);
  if (entry == null) throw new Error(`Unknown conversational onboarding task: ${taskId}`);
  return { entry, taskId };
}

function clearTaskSelection(): null { return null; }
function addDeclinedTask(current: string[], taskId: string): string[] { return current.includes(taskId) ? current : [...current, taskId]; }
function clearDeclinedTasks(): string[] { return []; }
function isPluginTask(value: unknown): boolean { return value != null && typeof value === "object" && "pluginName" in value; }
function importedItemTypes(histories: ImportHistory[]): Set<string> { return new Set(histories.flatMap((history) => history.successes.map((success) => success.itemType))); }
function importProviderIds(histories: ImportHistory[]): string[] { return [...new Set(histories.flatMap((history) => history.providerId == null ? [] : [history.providerId]))]; }
function hasAnyImportError(input: ImportSetupInput): boolean { return input.appsError != null || input.historiesError != null || input.mcpStatusesError != null; }
function setupTabs(state: ReturnType<typeof deriveImportedSetupOpportunity>): SetupTab[] { return (["apps", "mcps", "hooks"] as SetupTab[]).filter((tab) => state.tabStatus[tab] !== "ready" || tab === "apps" && (state.appsRequiringConnection.length + state.importedPlugins.length > 0) || tab === "mcps" && state.mcpServerNamesRequiringAuthentication.length > 0 || tab === "hooks" && state.hasImportedHooks); }
function taskCatalog(entries: Array<[string, unknown]>) { return new Map(entries); }
function taskPluginNames(items: ProjectedChecklistItem[]): string[] { return [...new Set(items.flatMap((item) => item.pluginMentions?.map((mention) => stripPluginVersion(mention.pluginId)) ?? []))]; }
function taskPluginIds(items: ProjectedChecklistItem[]): string[] { return [...new Set(items.flatMap((item) => item.pluginMentions?.map((mention) => mention.pluginId) ?? []))]; }
function isImportedConfiguration(success: ImportSuccess): boolean { return success.itemType === "MCP_SERVER_CONFIG" || success.itemType === "PLUGINS"; }
function providerAllowsUnknownNames(providerId: string): boolean { return providerId !== "claude-cowork"; }
function isSessionImport(success: ImportSuccess): boolean { return success.itemType === "SESSIONS"; }
function importCompletedAfter(history: ImportHistory, startedAtMs: number): boolean { return Number(history.completedAtMs) >= startedAtMs; }
function retryCallbacks(callbacks: Array<(() => unknown) | undefined>): () => void { return () => { for (const callback of callbacks) callback?.(); }; }
function openImportedSetupModal(options: { onOpen?: (options: unknown) => void } & Record<string, unknown>): void { options.onOpen?.(options); }
function initializeChecklistProjection(): void { initializeImportedSetupOpportunity(); }
function initializeImportCorrelation(): void { initializeImportedSetupOpportunity(); }
function initializeTaskCatalog(): void { initializeImportedSetupOpportunity(); }
function initializeImportedSetupModal(): void { initializeImportedSetupOpportunity(); }

// Keep the release short-name ABI while the readable names above document the
// behavior. Several aliases belong to the former aggregation surface and now
// intentionally point at the single semantic implementation that owns them.
export {
  deriveImportedSetupOpportunity as $,
  initializeChecklistProjection as A,
  initializeTaskCatalog as B,
  hasImportedConnectorSetup as C,
  hasImportedHooks as D,
  normalizeImportName as E,
  taskCatalog as F,
  importedItemTypes as G,
  importProviderIds as H,
  hasAnyImportError as I,
  setupTabs as J,
  chooseVisibleTaskIds as K,
  DEFAULT_TASK_IDS as L,
  taskPluginNames as M,
  taskPluginIds as N,
  hasImportedSessions as O,
  MAX_VISIBLE_TASKS as P,
  filterImportedApps as Q,
  retryCallbacks as R,
  CREATE_PROJECT_ITEM as S,
  IMPORT_CLAUDE_ITEM as T,
  ENABLE_NOTIFICATIONS_ITEM as U,
  collectRemotePluginIds as V,
  isPluginTask as W,
  taskEntry as X,
  selectTaskEntry as Y,
  clearTaskSelection as Z,
  isImportedConfiguration as _,
  deriveImportedSetupOpportunity as _t,
  taskEntry as a,
  createChecklistSnapshot as at,
  chooseVisibleTaskIds as b,
  isSessionImport as bt,
  taskPluginNames as c,
  createChecklistSnapshot as ct,
  importedItemTypes as d,
  primaryPluginName as dt,
  importProviderIds as et,
  addDeclinedTask as f,
  resolveImportedSetupLabel as ft,
  taskPluginIds as g,
  initializeChecklistProjection as gt,
  hasAnyImportError as h,
  promptWithMentions as ht,
  openImportedSetupModal as i,
  importCompletedAfter as it,
  hasImportedConnectorSetup as j,
  hasImportedMcpServers as k,
  initializeImportCorrelation as l,
  filterDisabledRemotePlugins as lt,
  selectTaskEntry as m,
  collectRemotePluginIds as mt,
  useImportedSetupOpportunity as n,
  normalizeImportName as nt,
  clearTaskSelection as o,
  providerAllowsUnknownNames as ot,
  clearDeclinedTasks as p,
  projectImportedSetupItems as pt,
  replacePromptValues as q,
  initializeImportedSetupModal as r,
  renderPluginMention as rt,
  statusFrom as s,
  stripPluginVersion as st,
  initializeImportedSetupOpportunity as t,
  mcpServerNamesRequiringAuthentication as tt,
  filterImportedApps as u,
  resolveInstructions as ut,
  foregroundHistories as v,
  createPluginMention as vt,
  localizedField as w,
  humanizePluginName as x,
  taskPluginNames as y,
  initializeTaskCatalog as yt,
  formatPrompt as z,
};

initializeImportedSetupOpportunity();
