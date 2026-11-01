import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as visibleSectionsChunk from "@rchunk/use-visible-settings-sections";
import * as hostDropdownChunk from "@rchunk/settings-host-dropdown";
import "@rchunk/experimental-feature-visibility";
import * as routeStateChunk from "@rchunk/settings-route-state";
import "@rchunk/dock-icon-setting-visibility";
import * as unsavedDialogChunk from "@rchunk/settings-unsaved-changes-dialog";
import "@rchunk/filter";

interface LocationState { hash: string; key: string; pathname: string; search: string; state: unknown }
interface RemoteConnection { displayName: string; hostId: string }
interface SettingsSection { disabled?: boolean; label: string; slug: string }
interface VisibleSettingsResult {
  activeSettingsSection: string;
  settingsNavigationSections: SettingsSection[];
  shouldRedirectToVisibleSettingsSection: boolean;
  shouldRenderRouteContent: boolean;
  visibleSettingsSections: SettingsSection[];
}
interface SearchDocument { messages?: Array<{ defaultMessage?: string }>; sectionSlug: string; terms?: string[] }
interface NavigateOptions { replace?: boolean; state?: unknown }
type Navigate = (destination: number | string, options?: NavigateOptions) => void;

const sharedRuntime = appSharedChunk as unknown as {
  $3(): void;
  HX<Value>(signal: unknown): Value;
  I3(): import("@rchunk/app-shared").JsxRuntime;
  LX(scope: unknown): { set(signal: unknown, value: unknown): void };
  ZI: unknown;
  e6(): import("@rchunk/app-shared").ReactRuntime;
};
const { $3: initializeRuntimeLazy, HX: useSignalValue, I3: getJsxRuntime, LX: useScope, ZI: AppScope, e6: getReactRuntime } = sharedRuntime;

const initialRuntime = appInitialChunk as unknown as {
  CE: unknown;
  Gv(): { connectedRemoteConnections: RemoteConnection[]; selectedHostId: string; setSelectedHostId(hostId: string): void };
  Ul(section: string): string;
  Vfn(hostId: string): { kind: string };
  Xgn(props: { context: { onSelectSection(section: string, scrollText?: string): void; visibleSettingsSections: SettingsSection[] }; hostId: string }): unknown;
  a_n(pattern: string): { params: { section?: string } } | null;
  i_n(): LocationState;
  o_n(): Navigate;
  ew: unknown;
  ugn: string;
};
const { CE: dirtySettingsSignal, Gv: useSettingsHosts, Ul: buildSettingsPath, Vfn: getHost, Xgn: SettingsRouteContent, a_n: useRouteMatch, i_n: useLocation, o_n: useNavigate, ew: narrowSettingsSignal, ugn: localHostId } = initialRuntime;

const visibleRuntime = visibleSectionsChunk as unknown as {
  n(activeSection?: string | null, isLocalHost?: boolean, hostId?: string): SettingsSection[] | VisibleSettingsResult;
  t(): void;
};
const { n: useVisibleSettingsSections, t: initializeVisibleSettingsSections } = visibleRuntime;
const hostRuntime = hostDropdownChunk as unknown as { n(): void; t(props: Record<string, unknown>): unknown };
const { n: initializeSettingsHostDropdown, t: SettingsHostDropdown } = hostRuntime;
const routeRuntime = routeStateChunk as unknown as { i(value: unknown): boolean; o(): void };
const { i: shouldReturnToPreviousHistoryEntry, o: initializeSettingsRouteState } = routeRuntime;
const dialogRuntime = unsavedDialogChunk as unknown as { n(): void; t(props: { onClearPendingNavigation(): void; pendingNavigation: (() => void) | null }): unknown };
const { n: initializeUnsavedDialog, t: SettingsUnsavedChangesDialog } = dialogRuntime;

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;
let searchDocumentsPromise: Promise<SearchDocument[]> | null = null;

const GROUPS = [
  { heading: "Personal", slugs: ["general-settings", "notifications", "import", "profile", "appearance", "security", "account", "parental-controls", "trusted-contact", "safety", "voice", "storage", "agent", "personalization", "pets", "keyboard-shortcuts", "usage", "billing", "analytics", "consumer-view", "usage-code-review", "debug"] },
  { heading: "Integrations", slugs: ["computer-use", "chronicle", "appshots", "codex-micro", "mcp-settings", "plugins-settings", "skills-settings", "browser-use"] },
  { heading: "Coding", slugs: ["hooks-settings", "connections", "cloud-settings", "cloud-environments", "code-review", "git-settings", "local-environments", "environments", "worktrees"] },
  { heading: "Archived", slugs: ["data-controls"] },
] as const;

function normalizeVisibleResult(value: SettingsSection[] | VisibleSettingsResult, requested: string | null): VisibleSettingsResult {
  if (!Array.isArray(value)) return value;
  const fallback = value[0]?.slug ?? "general-settings";
  const active = value.some((section) => section.slug === requested) ? requested as string : fallback;
  return { activeSettingsSection: active, settingsNavigationSections: value, shouldRedirectToVisibleSettingsSection: requested != null && active !== requested, shouldRenderRouteContent: value.length > 0, visibleSettingsSections: value };
}

function loadSearchDocuments(): Promise<SearchDocument[]> {
  if (searchDocumentsPromise == null) {
    searchDocumentsPromise = import("@rchunk/settings-search-documents").then((module: { settingsSearchDocuments?: SearchDocument[] }) => module.settingsSearchDocuments ?? []).catch(() => []);
  }
  return searchDocumentsPromise;
}

function groupedSections(sections: SettingsSection[]): Array<{ heading: string; sections: SettingsSection[] }> {
  const remaining = new Map(sections.map((section) => [section.slug, section]));
  const groups: Array<{ heading: string; sections: SettingsSection[] }> = GROUPS.map((group) => ({ heading: group.heading, sections: group.slugs.flatMap((slug) => { const section = remaining.get(slug); if (section == null) return []; remaining.delete(slug); return [section]; }) })).filter((group) => group.sections.length > 0);
  const extras = [...remaining.values()];
  if (extras.length > 0) (groups.at(-1) ?? groups[groups.push({ heading: "Other", sections: [] }) - 1]).sections.push(...extras);
  return groups;
}

function Sidebar({ activeSection, connectedRemoteConnections, onBack, onSelect, searchHostId, sections, selectedHostId, setSelectedHostId }: { activeSection: string | null; connectedRemoteConnections: RemoteConnection[]; onBack(): void; onSelect(section: string, scrollText?: string): void; searchHostId: string; sections: SettingsSection[]; selectedHostId: string; setSelectedHostId(hostId: string): void }): unknown {
  const [query, setQuery] = React.useState("");
  const [documents, setDocuments] = React.useState<SearchDocument[]>([]);
  const normalized = query.trim().toLocaleLowerCase();
  const documentTerms = new Map(documents.map((document) => [document.sectionSlug, [...(document.terms ?? []), ...(document.messages ?? []).map((message) => message.defaultMessage ?? "")].join(" " ).toLocaleLowerCase()]));
  const visible = normalized.length === 0 ? sections : sections.filter((section) => section.label.toLocaleLowerCase().includes(normalized) || documentTerms.get(section.slug)?.includes(normalized));
  const changeSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length > 0 && documents.length === 0) void loadSearchDocuments().then(setDocuments);
  };
  return jsx.jsxs("aside", { className: "flex h-full min-h-0 w-72 flex-col border-r border-token-border-light", children: [
    jsx.jsxs("div", { className: "flex items-center gap-2 border-b p-3", children: [jsx.jsx("button", { type: "button", "aria-label": "Back to app", onClick: onBack, children: "Back" }), connectedRemoteConnections.length === 0 ? null : jsx.jsx(SettingsHostDropdown, { align: "end", connectedRemoteConnections, contentWidth: "sidebar", localLabel: "All settings", onSelectHost: setSelectedHostId, selectedHostId, showConnectedIndicator: true, triggerVariant: "filter" })] }),
    jsx.jsx("div", { className: "p-3", children: jsx.jsx("input", { type: "search", "aria-label": "Search settings", placeholder: "Search settings", value: query, onChange: (event: { currentTarget: { value: string } }) => changeSearch(event.currentTarget.value) }) }),
    selectedHostId === localHostId ? null : jsx.jsxs("div", { className: "mx-3 mb-2 rounded border p-2 text-sm", children: [jsx.jsx("span", { children: "Showing settings for " + searchHostId }), jsx.jsx("button", { type: "button", onClick: () => setSelectedHostId(localHostId), children: "Clear filter" })] }),
    jsx.jsx("nav", { className: "min-h-0 flex-1 overflow-auto px-2 pb-3", children: normalized.length > 0 ? (visible.length === 0 ? jsx.jsx("div", { role: "status", className: "p-3 text-sm text-secondary", children: "No settings found" }) : visible.map((section) => jsx.jsx("button", { type: "button", "aria-current": section.slug === activeSection ? "page" : undefined, className: "block w-full rounded px-3 py-2 text-left", onClick: () => onSelect(section.slug, query), children: section.label }, section.slug))) : groupedSections(visible).map((group) => jsx.jsxs("section", { children: [jsx.jsx("h2", { className: "px-3 pb-1 pt-3 text-xs font-semibold uppercase text-secondary", children: group.heading }), group.sections.map((section) => jsx.jsx("button", { type: "button", role: "tab", "aria-selected": section.slug === activeSection, className: "block w-full rounded px-3 py-2 text-left", onClick: () => onSelect(section.slug), children: section.label }, section.slug))] }, group.heading)) }),
  ] });
}

function SettingsPage(): unknown {
  initializeSettingsPage();
  const appScope = useScope(AppScope);
  const navigate = useNavigate();
  const location = useLocation();
  const match = useRouteMatch("/settings/:section/*");
  const requestedSection = match?.params.section ?? location.pathname.split("/").filter(Boolean)[1] ?? null;
  const { connectedRemoteConnections, selectedHostId, setSelectedHostId } = useSettingsHosts();
  const isLocal = getHost(selectedHostId).kind === "local";
  const visible = normalizeVisibleResult(useVisibleSettingsSections(requestedSection, isLocal, selectedHostId), requestedSection);
  const dirty = useSignalValue<Set<string>>(dirtySettingsSignal).size > 0;
  const narrow = useSignalValue<boolean>(narrowSettingsSignal);
  const [pendingNavigation, setPendingNavigation] = React.useState<(() => void) | null>(null);
  const requestNavigation = (action: () => void) => dirty ? setPendingNavigation(() => action) : action();
  const selectSection = (section: string, scrollText?: string) => {
    if (section === visible.activeSettingsSection && scrollText == null) return;
    requestNavigation(() => navigate(buildSettingsPath(section), { replace: true, state: location.state }));
  };
  const onBack = () => requestNavigation(() => shouldReturnToPreviousHistoryEntry(location.state) ? navigate(-1) : navigate("/", { replace: true }));
  React.useEffect(() => {
    if (visible.shouldRedirectToVisibleSettingsSection) navigate(buildSettingsPath(visible.activeSettingsSection), { replace: true });
  }, [navigate, visible.activeSettingsSection, visible.shouldRedirectToVisibleSettingsSection]);
  React.useEffect(() => () => appScope.set(dirtySettingsSignal, new Set()), [appScope]);
  if (visible.visibleSettingsSections.length === 0) return jsx.jsx("div", { role: "alert", children: "Settings are unavailable" });
  const sidebar = jsx.jsx(Sidebar, { activeSection: narrow && requestedSection != null ? null : visible.activeSettingsSection, connectedRemoteConnections, onBack, onSelect: selectSection, searchHostId: selectedHostId, sections: visible.settingsNavigationSections, selectedHostId, setSelectedHostId: (hostId: string) => requestNavigation(() => setSelectedHostId(hostId)) });
  const routeContent = visible.shouldRenderRouteContent ? jsx.jsx(React.Suspense, { fallback: jsx.jsx("div", { role: "status", children: "Loading settings…" }), children: jsx.jsx(SettingsRouteContent, { context: { onSelectSection: selectSection, visibleSettingsSections: visible.visibleSettingsSections }, hostId: selectedHostId }) }) : jsx.jsx("div", { role: "status", children: "Loading settings…" });
  return jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsxs("div", { className: "flex h-full min-h-0", children: [
      narrow && requestedSection != null ? null : sidebar,
      narrow && requestedSection == null ? null : jsx.jsxs("main", { className: "min-w-0 flex-1 overflow-auto", children: [narrow ? jsx.jsx("button", { type: "button", "aria-label": "Back to settings", onClick: () => navigate("/settings", { replace: true }), children: "Back to settings" }) : null, routeContent] }),
    ] }),
    jsx.jsx(SettingsUnsavedChangesDialog, { pendingNavigation, onClearPendingNavigation: () => setPendingNavigation(null) }),
  ] });
}

let initialized = false;
function initializeSettingsPage(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeVisibleSettingsSections();
  initializeSettingsHostDropdown();
  initializeSettingsRouteState();
  initializeUnsavedDialog();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeSettingsPage();
export { SettingsPage };
