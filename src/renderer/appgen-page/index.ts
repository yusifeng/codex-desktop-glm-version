// appgen-page —— Sites 首页：拥有/共享视图、搜索、分页和创建入口。
// 原版：app/webview/assets/appgen-page-f089a1ed2fdc.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appgenAccessChunk from "@rchunk/appgen-access";
import * as disabledTooltipChunk from "@rchunk/appgen-disabled-tooltip";
import * as startConversationChunk from "@rchunk/start-appgen-conversation";
import * as automationsStateChunk from "@rchunk/appgen-automations-state";
import * as titleVisibilityChunk from "@rchunk/use-searchable-page-title-visibility";
import * as accessMessagesChunk from "@rchunk/appgen-access-state-messages";
import * as shareDialogChunk from "@rchunk/open-appgen-share-dialog";
import * as thumbnailChunk from "@rchunk/sites-default-thumbnail";

void runtimeChunk;
void appPrimaryChunk;

interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown }
interface ReactRuntime { useEffect(effect: () => void | (() => void), dependencies: unknown[]): void; useState<T>(initial: T): [T, (value: T | ((current: T) => T)) => void] }
interface IntlRuntime { formatMessage(message: { defaultMessage: string; id: string }, values?: Record<string, unknown>): string }
interface ApiClient { safeGet<Result>(path: string, options?: { signal?: AbortSignal }): Promise<Result> }
interface AppSharedBindings { $3(): void; FX(): void; I3(): JsxRuntime; K2(): void; Qh: unknown; Y2: unknown; Yh: unknown; e6(): ReactRuntime; n4(): IntlRuntime }
interface AppInitialBindings { Qgn(): void; _dn: ApiClient; fdn(): void; lnn(): void; o_n(): (path: string) => void }
interface StartConversationBindings { n(scope: unknown, launcher: (options: Record<string, unknown>) => void, request: Record<string, unknown>, options: Record<string, unknown>): void; t(): void }
interface AccessBindings { r(policy: Record<string, unknown> | null | undefined): { accessMode: string; groupCount: number; userCount: number }; s(): void }
interface DisabledBindings { n(): void; t: unknown }
interface AutomationBindings { r(): void }
interface VisibilityBindings { n(): { scrollContainerRef(value: Element | null): void; showTitleInToolbar: boolean; titleRef(value: Element | null): void }; t(): void }
interface AccessMessageBindings { n(): void; t(state: { accessMode: string; groupCount: number; userCount: number }): unknown }
interface ShareBindings { n(scope: unknown, project: SiteProject, options: Record<string, unknown>): void; t(): void }
interface ThumbnailBindings { n(): void; t(props: Record<string, unknown>): unknown }

interface SiteProject {
  access_policy?: Record<string, unknown> | null;
  current_live_url?: string | null;
  current_user_role?: string | null;
  description?: string | null;
  disabled_by?: string | null;
  id: string;
  latest_edit_context?: unknown;
  screenshot_url?: string | null;
  slug: string;
  status?: string | null;
  title: string;
  updated_at?: string | null;
}
interface SitesResponse { items: SiteProject[]; next_cursor?: string | null }

const { $3: initializeRuntime, FX: initializeSignals, I3: getJsxRuntime, K2: initializeComponents, Qh: LoadingSpinner, Y2: FormattedMessage, Yh: Button, e6: getReactRuntime, n4: useIntl } = appSharedChunk as unknown as AppSharedBindings;
const { Qgn: initializeRouter, _dn: apiClient, fdn: initializeApi, lnn: initializeAppgenQueries, o_n: useNavigate } = appInitialChunk as unknown as AppInitialBindings;
const { n: startAppgenConversation, t: initializeStartConversation } = startConversationChunk as unknown as StartConversationBindings;
const { r: summarizeAccessPolicy, s: initializeAccess } = appgenAccessChunk as unknown as AccessBindings;
const { n: initializeDisabledTooltip, t: AppgenDisabledTooltip } = disabledTooltipChunk as unknown as DisabledBindings;
const { r: initializeAutomationState } = automationsStateChunk as unknown as AutomationBindings;
const { n: useTitleVisibility, t: initializeTitleVisibility } = titleVisibilityChunk as unknown as VisibilityBindings;
const { n: initializeAccessMessages, t: AccessStateMessage } = accessMessagesChunk as unknown as AccessMessageBindings;
const { n: openShareDialog, t: initializeShareDialog } = shareDialogChunk as unknown as ShareBindings;
const { n: initializeThumbnail, t: SiteThumbnail } = thumbnailChunk as unknown as ThumbnailBindings;

initializeRuntime(); initializeSignals(); initializeComponents(); initializeRouter(); initializeApi(); initializeAppgenQueries(); initializeStartConversation(); initializeAccess(); initializeDisabledTooltip(); initializeAutomationState(); initializeTitleVisibility(); initializeAccessMessages(); initializeShareDialog(); initializeThumbnail();
const React = getReactRuntime();
const jsx = getJsxRuntime();

type ViewMode = "owned" | "shared";

function AppgenPage(): unknown {
  const intl = useIntl();
  const navigate = useNavigate();
  const [view, setView] = React.useState<ViewMode>("owned");
  const [query, setQuery] = React.useState("");
  const [projects, setProjects] = React.useState<SiteProject[] | null>(null);
  const [error, setError] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const visibility = useTitleVisibility();

  React.useEffect(() => {
    const controller = new AbortController();
    setProjects(null);
    setError(false);
    const path = view === "shared"
      ? `/websites/shared?limit=50${query.trim() === "" ? "" : `&query=${encodeURIComponent(query.trim().slice(0, 200))}`}`
      : "/websites?limit=50";
    void apiClient.safeGet<SitesResponse>(path, { signal: controller.signal }).then(
      (response) => setProjects(response.items.filter((project) => view !== "shared" || project.current_user_role !== "owner")),
      () => { if (!controller.signal.aborted) setError(true); },
    );
    return () => controller.abort();
  }, [query, refreshKey, view]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleProjects = projects?.filter((project) =>
    normalizedQuery === "" || [project.title, project.slug, project.description ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
  const createSite = (): void => startAppgenConversation({}, () => undefined, { type: "create" }, {});
  const editSite = (project: SiteProject): void => startAppgenConversation({}, () => undefined, { type: "edit", projectId: project.id, projectTitle: project.title, liveUrl: project.current_live_url, latestEditContext: project.latest_edit_context }, {});

  let body: unknown;
  if (projects == null && !error) body = jsx.jsx(LoadingSpinner, {});
  else if (error) body = jsx.jsxs("section", { role: "alert", children: [jsx.jsx(FormattedMessage, { id: "appgenPage.error.title", defaultMessage: "Unable to load sites" }), jsx.jsx(Button, { color: "secondary", onClick: () => setRefreshKey((value) => value + 1), children: jsx.jsx(FormattedMessage, { id: "appgenPage.error.retry", defaultMessage: "Try again" }) })] });
  else if (visibleProjects?.length === 0) body = jsx.jsxs("section", { children: [jsx.jsx("h2", { children: normalizedQuery === "" ? (view === "shared" ? "No sites shared with you" : "No sites yet") : "No sites found" }), view === "owned" && normalizedQuery === "" ? jsx.jsx(Button, { color: "secondary", onClick: createSite, children: "Create new site" }) : null] });
  else body = jsx.jsx("ul", { children: visibleProjects?.map((project) => jsx.jsx(SiteRow, { project, onEdit: editSite }, project.id)) });

  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col bg-surface",
    children: [
      jsx.jsxs("header", { children: [visibility.showTitleInToolbar ? jsx.jsx("h1", { children: "Sites" }) : null, jsx.jsx(Button, { "aria-label": intl.formatMessage({ id: "appgenPage.refresh", defaultMessage: "Refresh sites" }), onClick: () => setRefreshKey((value) => value + 1), children: "Refresh" }), jsx.jsx(Button, { onClick: createSite, children: "Create" })] }),
      jsx.jsxs("main", { ref: visibility.scrollContainerRef, children: [
        jsx.jsx("h1", { ref: visibility.titleRef, children: "Sites" }),
        jsx.jsxs("nav", { "aria-label": "Site ownership", children: ["owned", "shared"].map((mode) => jsx.jsx("button", { type: "button", "aria-pressed": view === mode, onClick: () => setView(mode as ViewMode), children: mode === "owned" ? "Owned by you" : "Shared with you" }, mode)) }),
        jsx.jsx("input", { id: "appgen-site-search", "aria-label": "Search sites", placeholder: view === "shared" ? "Search across your workspace" : "Search sites", value: query, onChange: (event: { target: { value: string } }) => setQuery(event.target.value) }),
        body,
      ] }),
    ],
  });
}

function SiteRow({ project, onEdit }: { project: SiteProject; onEdit(project: SiteProject): void }): unknown {
  const access = summarizeAccessPolicy(project.access_policy);
  return jsx.jsxs("li", { children: [
    jsx.jsx(SiteThumbnail, { screenshotUrl: project.screenshot_url, title: project.title }),
    jsx.jsx("button", { type: "button", onClick: () => onEdit(project), children: project.title }),
    project.disabled_by == null ? null : jsx.jsx(AppgenDisabledTooltip, { disabledBy: project.disabled_by }),
    jsx.jsx(AccessStateMessage, { ...access }),
    jsx.jsx("button", { type: "button", onClick: () => openShareDialog({}, project, { source: "sites_access" }), children: "Share" }),
    project.current_live_url == null ? null : jsx.jsx("button", { type: "button", onClick: () => window.open(project.current_live_url ?? undefined, "_blank", "noopener,noreferrer"), children: "Open in browser" }),
  ] });
}

export { AppgenPage };
