import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as toolbarBreadcrumbChunk from "@rchunk/toolbar-breadcrumb";
import * as appsAvailabilityChunk from "@rchunk/apps-availability";
import * as computerUseApprovalsChunk from "@rchunk/computer-use-app-approvals-query";
import * as useHomeDirectoryChunk from "@rchunk/use-home-directory";
import * as settingsLoadingRowChunk from "@rchunk/settings-loading-row";
import * as browserStatusChunk from "@rchunk/browser-extension-connection-status-description";
import * as settingsPluginSelectionChunk from "@rchunk/settings-plugin-selection";

interface ReactRuntime {
  useState<Value>(initialValue: Value | (() => Value)): [Value, (next: Value | ((current: Value) => Value)) => void];
}
interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}
interface ScopeRuntime { get(signal: unknown): unknown }
interface ToastManager {
  danger(message: string, options?: { errorAnalytics?: { toastId: string } }): void;
  success(message: string): void;
}
interface QueryResult<Data> {
  data?: Data;
  isError: boolean;
  isLoading: boolean;
  refetch(): Promise<unknown>;
}
interface ComputerUseApp { id: string; isEnabled: boolean; name: string }
interface BrowserStatus { installUrl?: string; isInstalled: boolean; isLoading: boolean }
interface AvailabilityState {
  apps?: ComputerUseApp[];
  available: boolean;
  browserStatus?: BrowserStatus;
  errorMessage?: string | null;
  isLoading: boolean;
  retry?(): Promise<unknown> | unknown;
}
interface ApprovedApp { bundleIdentifier: string; displayName: string; iconDataURL?: string | null }
interface AppApprovals { approvedApps: ApprovedApp[] }
type ReadDecision = "alwaysAllow" | "alwaysDeny" | "ask";
type ReadPolicy = "allowAllChats" | "allowUnconfiguredChats" | "askPerChat";
interface MessageChat { chatGUID: string; decision?: ReadDecision; displayName: string }
interface ReadPermissions { chats: MessageChat[]; readAccessPolicy: ReadPolicy }
interface SendPermissions { allowAllChats: boolean; approvedChats: MessageChat[] }
interface LockedUseState { enabled?: boolean }
interface SearchResult { chats?: MessageChat[]; status?: "ok" | "permissions_pending" | "permissions_required" }
interface SearchListRuntime {
  Action: (props: Record<string, unknown>) => unknown;
  Item: (props: Record<string, unknown>) => unknown;
  List: (props: Record<string, unknown>) => unknown;
  Root: (props: Record<string, unknown>) => unknown;
}
interface AppsAvailabilityController {
  isUpdating: boolean;
  setAppEnabled(update: { appId: string; appName?: string; enabled: boolean }): Promise<void>;
  updatingAppId: string | null;
}

const {
  $3: initializeSharedRuntime,
  BX: useFamilyValue,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  e6: getReactRuntime,
  pk: toastManagerSignal,
} = appSharedChunk as unknown as {
  $3(): void;
  BX<Value>(signal: unknown, parameter?: unknown): Value;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX(scope: unknown): ScopeRuntime;
  ZI: unknown;
  e6(): ReactRuntime;
  pk: unknown;
};
const {
  E6t: usePlatform,
  Gv: useSelectedHost,
  Kcn: readSetting,
  Ucn: writeSetting,
  Xl: initializeSettingsRuntime,
  e8t: useNavigate,
  i_n: useLocation,
  su: initializeAccountRuntime,
} = appInitialChunk as unknown as {
  E6t(): { platform: string };
  Gv(): { selectedHostId: string };
  Kcn(settingId: string): unknown;
  Ucn(scope: unknown, setting: { key: string }, value: unknown): Promise<void>;
  Xl(): void;
  e8t(): (path: string) => void;
  i_n(): { pathname: string };
  su(): void;
};
const { ac: initializeComputerUseSearch, ic: SearchList } = appPrimaryChunk as unknown as { ac(): void; ic: SearchListRuntime };
const { n: initializeToolbarBreadcrumb, t: ToolbarBreadcrumb } = toolbarBreadcrumbChunk;
const { n: useAppsAvailability, t: initializeAppsAvailability } = appsAvailabilityChunk;
const {
  _: initializeComputerUseAvailability,
  a: messagesReadQuery,
  c: removeReadPermission,
  d: setLockedUseEnabled,
  f: setReadAccessPolicy,
  g: computerUseAvailability,
  h: setSoundMode,
  i: lockedUseQuery,
  l: removeSendPermission,
  m: setSendAllowAllChats,
  n: soundModeQuery,
  o: messagesSendQuery,
  p: setReadDecision,
  r: initializeComputerUseQueries,
  s: removeAppApproval,
  t: appApprovalsQuery,
  u: searchMessagesChats,
} = computerUseApprovalsChunk as unknown as {
  _(): void;
  a: unknown;
  c(id: string): Promise<ReadPermissions | null>;
  d(enabled: boolean): Promise<boolean | null>;
  f(policy: ReadPolicy): Promise<ReadPermissions | null>;
  g: unknown;
  h(mode: string): Promise<string | null>;
  i: unknown;
  l(id: string): Promise<SendPermissions | null>;
  m(enabled: boolean): Promise<SendPermissions | null>;
  n: unknown;
  o: unknown;
  p(id: string, decision: ReadDecision, metadata: unknown): Promise<ReadPermissions | null>;
  r(): void;
  s(id: string): Promise<AppApprovals | null>;
  t: unknown;
  u(query: string, signal: AbortSignal): Promise<SearchResult | null>;
};
const { n: useHomeDirectory, t: initializeUseHomeDirectory } = useHomeDirectoryChunk;
const { n: initializeSettingsLoadingRow, t: SettingsLoadingRow } = settingsLoadingRowChunk;
const { n: initializeBrowserStatus, t: BrowserStatusDescription } = browserStatusChunk as { n(): void; t(props: { status: BrowserStatus }): unknown };
const {
  a: OriginSettingsRow,
  i: initializePluginSelection,
  n: handleOriginPermission,
  o: initializeOriginSettings,
  r: BrowserUseSettingsSection,
  t: initializeOriginSettingsRow,
} = settingsPluginSelectionChunk as unknown as {
  a(props: { origin: string }): unknown;
  i(): void;
  n(origin: string, permission: string): void;
  o(): void;
  r(props: Record<string, unknown>): unknown;
  t(): void;
};

initializeSharedRuntime();
initializeSettingsRuntime();
initializeAccountRuntime();
initializeComputerUseSearch();
initializeToolbarBreadcrumb();
initializeAppsAvailability();
initializeComputerUseAvailability();
initializeComputerUseQueries();
initializeUseHomeDirectory();
initializeSettingsLoadingRow();
initializeBrowserStatus();
initializePluginSelection();
initializeOriginSettings();
initializeOriginSettingsRow();

const React = getReactRuntime();
const { Fragment, jsx, jsxs } = getJsxRuntime();
const defaultApps: ComputerUseApp[] = [
  { id: "computer-use", isEnabled: true, name: "Any App" },
  { id: "chrome", isEnabled: true, name: "Google Chrome" },
  { id: "messages", isEnabled: true, name: "Messages" },
  { id: "connector_openai_codex_document_control", isEnabled: true, name: "Microsoft Excel" },
];

function SettingsRow(props: { control?: unknown; description?: unknown; label: unknown }): unknown {
  return jsxs("div", { className: "settings-row", children: [jsxs("div", { children: [jsx("strong", { children: props.label }), props.description == null ? null : jsx("p", { children: props.description })] }), props.control ?? null] });
}

function ErrorState(props: { message: string; onRetry?(): void }): unknown {
  return jsxs("div", { role: "alert", children: [jsx("span", { children: props.message }), props.onRetry == null ? null : jsx("button", { type: "button", onClick: props.onRetry, children: "Retry" })] });
}

function AppControls(props: { availability: AvailabilityState; hostId: string; platform: string; scope: ScopeRuntime; toast: ToastManager; navigate(path: string): void }): unknown {
  const homeDirectory = useHomeDirectory(props.hostId);
  const [apps, setApps] = React.useState(() => props.availability.apps ?? defaultApps);
  const controller = useAppsAvailability({
    apps,
    hostId: props.hostId,
    readApps: () => apps,
    writeConfig: async ({ edits }) => {
      const edit = edits[0];
      if (edit == null) return { status: "ok" };
      await writeSetting(props.scope, { key: edit.keyPath }, edit.value);
      return { status: "ok" };
    },
    writeOptimistic: (nextApps) => setApps(nextApps.map((app) => ({ id: app.id, isEnabled: app.isEnabled, name: app.name ?? app.id }))),
    notify: (tone, text) => tone === "success" ? props.toast.success(text) : props.toast.danger(text),
  }) as AppsAvailabilityController;
  const browserStatus = props.availability.browserStatus ?? { isInstalled: false, isLoading: true };
  const browserSection = jsx(BrowserUseSettingsSection, { backend: "extension", browserUseEnabled: true, showHistory: false, showWebMcp: false, siteSettingsRow: jsx(OriginSettingsRow, { origin: "https://chatgpt.com" }) });
  return jsxs(Fragment, { children: [jsx("div", { "data-home-directory": homeDirectory ?? "", children: apps.map((app) => jsx(SettingsRow, { label: app.name, description: app.id === "computer-use" ? "Let ChatGPT control apps on your computer" : app.id === "messages" ? "Let ChatGPT read and send messages" : app.id === "chrome" ? jsx(BrowserStatusDescription, { status: browserStatus }) : "Let ChatGPT use Microsoft Excel add-in for additional control", control: jsxs("div", { children: [app.id === "messages" ? jsx("button", { type: "button", onClick: () => props.navigate("/settings/computer-use/messages"), children: "Manage" }) : null, jsx("input", { type: "checkbox", "aria-label": `Toggle ${app.name}`, checked: app.isEnabled, disabled: controller.isUpdating && controller.updatingAppId === app.id, onChange: async (event: { currentTarget: { checked: boolean } }) => { try { await controller.setAppEnabled({ appId: app.id, appName: app.name, enabled: event.currentTarget.checked }); } catch { return; } } })] }) }, app.id)) }), browserSection] });
}

function AllowedApps(props: { toast: ToastManager }): unknown {
  const query = useSignalValue<QueryResult<AppApprovals>>(appApprovalsQuery);
  const [filter, setFilter] = React.useState("");
  const [removed, setRemoved] = React.useState<Set<string>>(() => new Set());
  const [isRemoving, setIsRemoving] = React.useState(false);
  if (query.isLoading) return jsx(SettingsLoadingRow, { children: "Loading allowed apps…" });
  if (query.isError || query.data == null) return jsx(ErrorState, { message: "Unable to load allowed apps.", onRetry: () => void query.refetch() });
  const normalized = filter.trim().toLowerCase();
  const apps = query.data.approvedApps.filter((app) => !removed.has(app.bundleIdentifier) && (normalized.length === 0 || app.displayName.toLowerCase().includes(normalized)));
  return jsxs("section", { "aria-label": "Always-allowed apps", children: [jsx("h2", { children: "Always-allowed apps" }), jsx("input", { type: "search", "aria-label": "Search allowed apps", value: filter, onChange: (event: { currentTarget: { value: string } }) => setFilter(event.currentTarget.value) }), apps.length === 0 ? jsx("p", { children: normalized.length === 0 ? "None yet" : "No allowed apps match your search" }) : apps.map((app) => jsx(SettingsRow, { label: app.displayName, control: jsx("button", { type: "button", disabled: isRemoving, "aria-label": `Remove ${app.displayName}`, onClick: async () => { setIsRemoving(true); try { const result = await removeAppApproval(app.bundleIdentifier); if (result == null) throw new Error("Unavailable"); setRemoved((current) => new Set([...current, app.bundleIdentifier])); props.toast.success("Allowed app removed"); } catch { props.toast.danger("Unable to save allowed apps", { errorAnalytics: { toastId: "settings.computerUse.allowedApps.saveError" } }); } finally { setIsRemoving(false); } }, children: "Remove" }) }, app.bundleIdentifier))] });
}

function SoundAndLockedUse(props: { platform: string; toast: ToastManager }): unknown {
  const soundQuery = useSignalValue<QueryResult<string>>(soundModeQuery);
  const lockedQuery = useSignalValue<QueryResult<LockedUseState>>(lockedUseQuery);
  const [soundMode, setLocalSoundMode] = React.useState(soundQuery.data ?? "foregroundClicks");
  const [locked, setLocked] = React.useState(lockedQuery.data?.enabled ?? false);
  const [isSavingSound, setIsSavingSound] = React.useState(false);
  const [isSavingLocked, setIsSavingLocked] = React.useState(false);
  return jsxs("section", { "aria-label": "Computer use preferences", children: [soundQuery.data == null ? null : jsx(SettingsRow, { label: "Click sounds", control: jsx("select", { "aria-label": "Click sounds", value: soundMode, disabled: soundQuery.isLoading || isSavingSound, onChange: async (event: { currentTarget: { value: string } }) => { const value = event.currentTarget.value; setIsSavingSound(true); try { const result = await setSoundMode(value); if (result == null) throw new Error("Unavailable"); setLocalSoundMode(value); props.toast.success("Click sounds saved"); } catch { props.toast.danger("Unable to update click sounds"); } finally { setIsSavingSound(false); } }, children: [jsx("option", { value: "foregroundClicks", children: "Play sounds for foreground clicks" }), jsx("option", { value: "foregroundAndBackgroundClicks", children: "Play sounds for foreground and background clicks" }), jsx("option", { value: "off", children: "Don’t play sounds" })] }) }), props.platform === "macOS" && lockedQuery.data?.enabled != null ? jsx(SettingsRow, { label: "Locked use", description: "Let ChatGPT use your Mac when it's locked.", control: jsx("input", { type: "checkbox", "aria-label": "Enable Locked use", checked: locked, disabled: lockedQuery.isLoading || isSavingLocked, onChange: async (event: { currentTarget: { checked: boolean } }) => { const value = event.currentTarget.checked; setIsSavingLocked(true); try { const result = await setLockedUseEnabled(value); if (result == null) throw new Error("Unavailable"); setLocked(value); props.toast.success(value ? "Locked use enabled" : "Locked use disabled"); } catch { props.toast.danger("Unable to update Locked use", { errorAnalytics: { toastId: "settings.computerUse.backgroundAuth.saveError" } }); } finally { setIsSavingLocked(false); } } }) }) : null] });
}

function MessagesPermissions(props: { navigate(path: string): void; toast: ToastManager }): unknown {
  const readQuery = useSignalValue<QueryResult<ReadPermissions>>(messagesReadQuery);
  const sendQuery = useSignalValue<QueryResult<SendPermissions>>(messagesSendQuery);
  const [searchText, setSearchText] = React.useState("");
  const [searchState, setSearchState] = React.useState<{ error?: string; loading: boolean; results: MessageChat[] }>({ loading: false, results: [] });
  const [isSaving, setIsSaving] = React.useState(false);
  const [removedRead, setRemovedRead] = React.useState<Set<string>>(() => new Set());
  const [removedSend, setRemovedSend] = React.useState<Set<string>>(() => new Set());
  const loading = readQuery.isLoading || sendQuery.isLoading;
  const runSearch = async (): Promise<void> => { setSearchState({ loading: true, results: [] }); try { const result = await searchMessagesChats(searchText, new AbortController().signal); if (result?.status === "permissions_pending") { setSearchState({ error: "Finish Messages permission setup, then try again", loading: false, results: [] }); return; } if (result?.status === "permissions_required") { setSearchState({ error: "Allow Messages permissions to search chats", loading: false, results: [] }); return; } setSearchState({ loading: false, results: result?.chats ?? [] }); } catch { setSearchState({ error: "Unable to search chats", loading: false, results: [] }); } };
  const readData = readQuery.data;
  const sendData = sendQuery.data;
  return jsxs("main", { "data-settings-page": "computer-use-messages", children: [jsx(ToolbarBreadcrumb, { ancestors: [{ id: "computer-use", label: "Computer use", onClick: () => props.navigate("/settings/computer-use") }], current: "Messages" }), jsx("h1", { children: "Messages" }), loading ? jsx(SettingsLoadingRow, { children: "Loading Messages settings…" }) : null, readQuery.isError ? jsx(ErrorState, { message: "Unable to load read permissions", onRetry: () => void readQuery.refetch() }) : null, sendQuery.isError ? jsx(ErrorState, { message: "Unable to load allowed chats", onRetry: () => void sendQuery.refetch() }) : null, readData == null ? null : jsxs("section", { "aria-label": "Read access", children: [jsx("h2", { children: "Read access" }), jsx(SettingsRow, { label: "Reading behavior", control: jsx("select", { "aria-label": "Reading behavior", value: readData.readAccessPolicy, disabled: isSaving, onChange: async (event: { currentTarget: { value: ReadPolicy } }) => { setIsSaving(true); try { const result = await setReadAccessPolicy(event.currentTarget.value); if (result == null) throw new Error("Unavailable"); props.toast.success("Read permission saved"); } catch { props.toast.danger("Unable to update read permission", { errorAnalytics: { toastId: "settings.computerUse.messages.readAccess.saveError" } }); } finally { setIsSaving(false); } }, children: [jsx("option", { value: "askPerChat", children: "Ask by default" }), jsx("option", { value: "allowUnconfiguredChats", children: "Allow by default" }), jsx("option", { value: "allowAllChats", children: "Allow all chats" })] }) }), readData.chats.filter((chat) => !removedRead.has(chat.chatGUID)).map((chat) => jsx(SettingsRow, { label: chat.displayName, description: chat.decision ?? "ask", control: jsx("button", { type: "button", disabled: isSaving, "aria-label": `Remove read permission for ${chat.displayName}`, onClick: async () => { setIsSaving(true); try { const result = await removeReadPermission(chat.chatGUID); if (result == null) throw new Error("Unavailable"); setRemovedRead((current) => new Set([...current, chat.chatGUID])); } catch { props.toast.danger("Unable to remove read permission"); } finally { setIsSaving(false); } }, children: "Remove" }) }, chat.chatGUID)), jsx("div", { children: jsxs(SearchList.Root, { label: "Chat", children: [jsx("input", { type: "search", "aria-label": "Search chats", placeholder: "Search chats", value: searchText, disabled: searchState.loading, onChange: (event: { currentTarget: { value: string } }) => setSearchText(event.currentTarget.value) }), jsx("button", { type: "button", disabled: searchState.loading || searchText.trim().length === 0, onClick: () => void runSearch(), children: searchState.loading ? "Searching chats…" : "Search" }), searchState.error == null ? null : jsx(ErrorState, { message: searchState.error, onRetry: () => void runSearch() }), jsx(SearchList.List, { "aria-busy": searchState.loading, children: searchState.results.length === 0 && !searchState.loading && searchState.error == null ? jsx("p", { children: "No chats found" }) : searchState.results.map((chat) => jsx(SearchList.Item, { children: jsxs(Fragment, { children: [jsx("span", { children: chat.displayName }), jsx(SearchList.Action, { onClick: async () => { setIsSaving(true); try { const result = await setReadDecision(chat.chatGUID, "alwaysAllow", chat.displayName); if (result == null) throw new Error("Unavailable"); props.toast.success("Read permission saved"); } catch { props.toast.danger("Unable to update read permission"); } finally { setIsSaving(false); } }, children: "Add" })] }) }, chat.chatGUID)) })] }) })] }), sendData == null ? null : jsxs("section", { "aria-label": "Send access", children: [jsx("h2", { children: "Send access" }), jsx(SettingsRow, { label: "Always allow sending to all chats", description: "When on, ChatGPT can send to every chat without asking you to approve the message or its recipients", control: jsx("input", { type: "checkbox", "aria-label": "Always allow sending to all chats", checked: sendData.allowAllChats, disabled: isSaving, onChange: async (event: { currentTarget: { checked: boolean } }) => { setIsSaving(true); try { const result = await setSendAllowAllChats(event.currentTarget.checked); if (result == null) throw new Error("Unavailable"); props.toast.success("Send permission saved"); } catch { props.toast.danger("Unable to update send permission"); } finally { setIsSaving(false); } } }) }), sendData.allowAllChats ? null : sendData.approvedChats.filter((chat) => !removedSend.has(chat.chatGUID)).map((chat) => jsx(SettingsRow, { label: chat.displayName, control: jsx("button", { type: "button", disabled: isSaving, "aria-label": `Remove ${chat.displayName}`, onClick: async () => { setIsSaving(true); try { const result = await removeSendPermission(chat.chatGUID); if (result == null) throw new Error("Unavailable"); setRemovedSend((current) => new Set([...current, chat.chatGUID])); } catch { props.toast.danger("Unable to remove send permission"); } finally { setIsSaving(false); } }, children: "Remove" }) }, chat.chatGUID))] })] });
}

function ComputerUseSettings(): unknown {
  const scope = useScope(AppScope);
  const toast = scope.get(toastManagerSignal) as ToastManager;
  const { selectedHostId } = useSelectedHost();
  const { platform } = usePlatform();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const availability = useFamilyValue<AvailabilityState>(computerUseAvailability, selectedHostId);
  if (pathname.includes("/settings/computer-use/messages")) return jsx(MessagesPermissions, { navigate, toast });
  let control: unknown;
  if (availability.isLoading) control = jsx(SettingsLoadingRow, { children: "Loading Computer Use settings…" });
  else if (availability.errorMessage != null) control = jsx(ErrorState, { message: availability.errorMessage, onRetry: availability.retry == null ? undefined : () => void availability.retry?.() });
  else if (!availability.available) control = jsx(ErrorState, { message: "Computer Use is unavailable for this host", onRetry: availability.retry == null ? undefined : () => void availability.retry?.() });
  else control = jsx(AppControls, { availability, hostId: selectedHostId, platform, scope, toast, navigate });
  const approvalQuery = useSignalValue<QueryResult<AppApprovals>>(appApprovalsQuery);
  void approvalQuery;
  const configuredOrigin = readSetting("computer-use-origin-permission");
  if (typeof configuredOrigin === "string") handleOriginPermission("https://chatgpt.com", configuredOrigin);
  return jsxs("main", { "data-settings-page": "computer-use", children: [jsx("h1", { children: "Computer use" }), jsx("p", { children: "Manage how ChatGPT uses other applications on your computer" }), jsx("section", { "aria-label": "Control", children: jsxs(Fragment, { children: [jsx("h2", { children: "Control" }), control] }) }), availability.available ? jsx(AllowedApps, { toast }) : null, availability.available ? jsx(SoundAndLockedUse, { platform, toast }) : null] });
}

export { ComputerUseSettings };
