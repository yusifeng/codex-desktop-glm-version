// appgen-site-detail-layout —— Site 详情页的共享标题栏、标签导航与内容容器。
// 原版：app/webview/assets/appgen-site-detail-layout-26be1094f84a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as tabsChunk from "@rchunk/security-tabs";
import * as breadcrumbChunk from "@rchunk/toolbar-breadcrumb";
import * as appgenAccessChunk from "@rchunk/appgen-access";
import * as disabledTooltipChunk from "@rchunk/appgen-disabled-tooltip";
import * as startConversationChunk from "@rchunk/start-appgen-conversation";
import { formatBrowserUrl as formatSiteHost } from "../app-primary/runtime/format-browser-url";
import type {
  IntlShape,
  JsxRuntime,
  MaitaiScopeApi,
  ReadableSignal,
  ScopedQueryFamily,
  ScopedQueryResult,
} from "@rchunk/app-shared";

void runtimeChunk;

type SiteDetailTab = "analytics" | "automations" | "database" | "settings";

interface AppgenSite {
  current_user_role?: string;
  current_live_url?: string | null;
  disabled_by?: string | null;
  id: string;
  latest_edit_context?: unknown;
  screenshot_url?: string | null;
  slug: string;
  status?: string;
  title: string;
}

interface AppgenSiteDetailLayoutProps {
  children(site: AppgenSite): unknown;
  prefetchTab?(tab: SiteDetailTab): Promise<unknown>;
  projectId: string;
  selectedTab: SiteDetailTab;
}

interface ReactContext<T> {
  Provider: unknown;
  value?: T;
}

interface ReactRuntime {
  createContext<T>(value: T): ReactContext<T>;
  useContext<T>(context: ReactContext<T>): T;
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useEffectEvent<Callback extends (...args: never[]) => unknown>(callback: Callback): Callback;
  useRef<T>(value: T): { current: T };
}

interface AppInitialBindings {
  Aet(): void;
  B9: unknown;
  Nan(): void;
  Pan(
    scope: MaitaiScopeApi<Record<string, unknown>>,
    event: {
      action: string;
      page?: string;
      projectId: string;
      source: string;
    },
  ): void;
  Qgn(): void;
  V9(): void;
  Ygn: unknown;
  _an(): void;
  a3t(): void;
  aan: ScopedQueryFamily<Record<string, unknown>, string, AppgenSite>;
  ann(projectId: string): string;
  can: ReadableSignal<ScopedQueryResult<{ database?: boolean }>>;
  cnn(projectId: string): string;
  d2(): void;
  enn: string;
  h2(): (options: Record<string, unknown>) => void;
  h7(): void;
  i3t: unknown;
  ifn(): void;
  inn(projectId: string): string;
  ket: unknown;
  lnn(): void;
  m7: unknown;
  o_n(): (destination: string) => void;
  ofn(flagId: string): boolean;
  onn(projectId: string): string;
  pfn(): void;
  sfn(flagId: string): boolean;
  vfn: ReadableSignal<boolean>;
  wan(url: string | null): { data?: string | null };
}

interface AppPrimaryBindings {
  Sf(): void;
}

const {
  $3: initializeRuntimeLazy,
  $h: initializeResourceButton,
  AT: initializeMountedState,
  Bk: interactionActions,
  BX: useSignalFamilyValue,
  C_: initializeIconAsset,
  FX: initializeSignalRuntime,
  Hk: interactionSources,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeSharedComponents,
  LX: useSignalScope,
  QI: initializeSharedRuntime,
  Qh: LoadingSpinner,
  S_: IconAsset,
  Vk: interactionPages,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: applicationScope,
  Zh: initializeButton,
  c_: initializeTooltip,
  e6: reactRuntimeExport,
  if: useIsMounted,
  jT: editIconAsset,
  n4: useIntl,
  o_: Tooltip,
  rf: initializeIntl,
} = appSharedChunk;
const {
  Aet: initializeAppgenHeader,
  B9: Header,
  Nan: initializeScreenshotQuery,
  Pan: trackAppgenInteraction,
  Qgn: initializeGptResources,
  V9: initializeNavigationComponents,
  Ygn: Navigate,
  _an: initializeAppgenRouting,
  a3t: initializeAppgenFeatureFlags,
  aan: appgenSiteQuery,
  ann: appgenAutomationsRoute,
  can: databaseAvailabilityQuery,
  cnn: appgenSettingsRoute,
  d2: initializeSiteComponents,
  enn: sitesDefaultRoute,
  h2: useStartConversationFromHome,
  h7: initializeHeaderLayout,
  i3t: SiteIcon,
  ifn: initializeExperiments,
  inn: appgenAnalyticsRoute,
  ket: ErrorStateView,
  lnn: initializeAppgenConversation,
  m7: HeaderBoundary,
  o_n: useNavigate,
  ofn: useFeatureGate,
  onn: appgenDatabaseRoute,
  pfn: initializeMigrationExperiment,
  sfn: useFeatureGateLoading,
  vfn: automationsAvailabilityLoadingSignal,
  wan: useScreenshot,
} = appInitialChunk as unknown as AppInitialBindings;
const { Sf: initializeAppgenFormatting } = appPrimaryChunk as unknown as AppPrimaryBindings;
const { n: initializeTabs, t: Tabs } = tabsChunk;
const { n: initializeBreadcrumb, t: ToolbarBreadcrumb } = breadcrumbChunk;
const {
  s: initializeAppgenAccess,
  t: canManageAppgenSite,
} = appgenAccessChunk;
const {
  n: initializeDisabledTooltip,
  t: AppgenDisabledTooltip,
} = disabledTooltipChunk;
const {
  n: startAppgenConversation,
  t: initializeStartAppgenConversation,
} = startConversationChunk;

let React: ReactRuntime;
let jsx: JsxRuntime;
let SiteContext: ReactContext<AppgenSite | null>;
let ANALYTICS_PANEL_ID: string;
let DATABASE_PANEL_ID: string;
let AUTOMATIONS_PANEL_ID: string;
let SETTINGS_PANEL_ID: string;

function AppgenSiteDetailLayout(props: AppgenSiteDetailLayoutProps): unknown {
  const existingSite = React.useContext(SiteContext);
  if (existingSite != null) {
    return jsx.jsx(jsx.Fragment, { children: props.children(existingSite) });
  }
  return jsx.jsx(AppgenSiteDetailLayoutRoot, { ...props });
}

function AppgenSiteDetailLayoutRoot({
  children,
  prefetchTab,
  projectId,
  selectedTab,
}: AppgenSiteDetailLayoutProps): unknown {
  const scope = useSignalScope(applicationScope);
  const navigate = useNavigate();
  const intl = useIntl();
  const isMounted = useIsMounted();
  const navigationSequence = React.useRef(0);
  const startConversationFromHome = useStartConversationFromHome();
  const automationsEnabled = useFeatureGate("282477705");
  const automationsFlagLoading = useFeatureGateLoading("282477705");
  const automationsAvailabilityLoading = useSignalValue(
    automationsAvailabilityLoadingSignal,
  );
  const analyticsEnabled = useFeatureGate("262557526");
  const databaseEnabled = useFeatureGate("1912312436");
  const { data: databaseAvailability, isError: databaseAvailabilityError } =
    useSignalValue(databaseAvailabilityQuery, { enabled: databaseEnabled });
  const {
    data: site,
    isError: siteError,
    isLoading: siteLoading,
  } = useSignalFamilyValue(appgenSiteQuery, projectId);
  const canManageSite = canManageAppgenSite(site);

  const trackPageView = React.useEffectEvent(() => {
    let page;
    switch (selectedTab) {
      case "automations":
        return;
      case "analytics":
        page = interactionPages.CODEX_APPGEN_INTERACTION_PAGE_ANALYTICS;
        break;
      case "database":
        page = interactionPages.CODEX_APPGEN_INTERACTION_PAGE_DATABASE;
        break;
      case "settings":
        page = interactionPages.CODEX_APPGEN_INTERACTION_PAGE_SETTINGS;
    }
    trackAppgenInteraction(scope, {
      action: interactionActions.CODEX_APPGEN_INTERACTION_ACTION_PAGE_VIEWED,
      page,
      projectId,
      source: interactionSources.CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS,
    });
  });
  const pageViewKey =
    site == null ||
    siteLoading ||
    siteError ||
    (selectedTab === "settings" && !canManageSite) ||
    selectedTab === "automations" ||
    (selectedTab === "analytics" && !analyticsEnabled) ||
    (selectedTab === "database" &&
      (!databaseEnabled ||
        databaseAvailabilityError ||
        databaseAvailability?.database !== true))
      ? null
      : `${site.id}:${selectedTab}`;
  React.useEffect(() => {
    if (pageViewKey != null) trackPageView();
  }, [pageViewKey]);

  const { data: screenshotSrc } = useScreenshot(site?.screenshot_url ?? null);
  const liveUrl = site?.status === "suspended" ? null : site?.current_live_url;

  if (site != null && selectedTab === "settings" && !canManageSite) {
    return jsx.jsx(Navigate, { replace: true, to: sitesDefaultRoute });
  }
  if (
    selectedTab === "automations" &&
    (automationsAvailabilityLoading || automationsFlagLoading)
  ) {
    return jsx.jsx(LoadingSpinner, {});
  }
  if (
    selectedTab === "automations" &&
    (!automationsEnabled || (site != null && !canManageSite))
  ) {
    return jsx.jsx(Navigate, {
      replace: true,
      to: appgenSettingsRoute(projectId),
    });
  }

  const tabItems = [
    {
      key: "settings",
      name: jsx.jsx(FormattedMessage, {
        id: "appgenSiteDetail.navigation.settings",
        defaultMessage: "Settings",
        description: "Tab label for Site settings",
      }),
      panelId: SETTINGS_PANEL_ID,
    },
  ];
  if (analyticsEnabled || selectedTab === "analytics") {
    tabItems.push({
      key: "analytics",
      name: jsx.jsx(FormattedMessage, {
        id: "appgenSiteDetail.navigation.analytics",
        defaultMessage: "Analytics",
        description: "Tab label for Site analytics",
      }),
      panelId: ANALYTICS_PANEL_ID,
    });
  }
  if (
    (databaseEnabled && databaseAvailability?.database === true) ||
    selectedTab === "database"
  ) {
    tabItems.push({
      key: "database",
      name: jsx.jsx(FormattedMessage, {
        id: "appgenSiteDetail.navigation.database",
        defaultMessage: "Database",
        description: "Tab label for the Site database viewer",
      }),
      panelId: DATABASE_PANEL_ID,
    });
  }
  if (automationsEnabled && canManageSite) {
    tabItems.push({
      key: "automations",
      name: jsx.jsx(FormattedMessage, {
        id: "appgenSiteDetail.navigation.automations",
        defaultMessage: "Automations",
        description: "Tab label for a Site's cloud scheduled tasks",
      }),
      panelId: AUTOMATIONS_PANEL_ID,
    });
  }

  const selectedPanel = getSelectedPanel(selectedTab, intl);
  const onBack = () => navigate("/sites");
  const onEdit =
    site == null
      ? undefined
      : () => {
          trackAppgenInteraction(scope, {
            action:
              interactionActions
                .CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED,
            projectId: site.id,
            source:
              interactionSources.CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS,
          });
          startAppgenConversation(scope, startConversationFromHome, {
            type: "edit",
            liveUrl,
            projectId: site.id,
            projectTitle: site.title,
            latestEditContext: site.latest_edit_context,
          }, {});
        };
  const header = jsx.jsx(SiteDetailHeader, { site, onBack, onEdit });

  let pageContent;
  if (siteLoading) {
    pageContent = jsx.jsx(LoadingState, {});
  } else if (siteError || site == null) {
    pageContent = jsx.jsx(ErrorState, {});
  } else {
    const siteSummary = jsx.jsx(SiteSummary, { screenshotSrc, site });
    const ariaLabel = intl.formatMessage({
      id: "appgenSiteDetail.navigation.label",
      defaultMessage: "Site details",
      description:
        "Accessible label for navigation between Site settings, analytics, and database",
    });
    const selectTab = (tab: SiteDetailTab) => {
      let destination: string;
      switch (tab) {
        case "automations":
          destination = appgenAutomationsRoute(projectId);
          break;
        case "settings":
          destination = appgenSettingsRoute(projectId);
          break;
        case "analytics":
          destination = appgenAnalyticsRoute(projectId);
          break;
        case "database":
          destination = appgenDatabaseRoute(projectId);
      }
      const sequence = (navigationSequence.current += 1);
      (prefetchTab?.(tab) ?? Promise.resolve()).catch(ignoreError).then(() => {
        if (isMounted() && sequence === navigationSequence.current)
          navigate(destination);
      });
    };
    const tabNavigation = jsx.jsx("div", {
      className: "border-b border-subtle pb-6",
      children: jsx.jsx(Tabs, {
        ariaLabel,
        selectedKey: selectedTab,
        tabs: tabItems,
        variant: "toolbar",
        onSelect: selectTab,
      }),
    });
    const siteContent = jsx.jsx(SiteContext.Provider, {
      value: site,
      children: children(site),
    });
    const panel = jsx.jsx("div", {
      id: selectedPanel.id,
      "aria-label": selectedPanel.label,
      role: "tabpanel",
      children: siteContent,
    });
    pageContent = jsx.jsxs(jsx.Fragment, {
      children: [siteSummary, tabNavigation, panel],
    });
  }

  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col bg-surface",
    children: [
      null,
      jsx.jsx(jsx.Fragment, {
        children: jsx.jsx(HeaderBoundary, { children: header }),
      }),
      jsx.jsx("div", {
        className:
          "flex min-h-0 flex-1 scrollbar-stable overflow-y-auto p-panel",
        children: jsx.jsx("div", {
          className: "mx-auto flex w-full max-w-3xl flex-col gap-6 pb-8",
          children: pageContent,
        }),
      }),
    ],
  });
}

function getSelectedPanel(
  selectedTab: SiteDetailTab,
  intl: IntlShape,
): { id: string; label: string } {
  const descriptors: Record<SiteDetailTab, { id: string; label: string }> = {
    automations: {
      id: AUTOMATIONS_PANEL_ID,
      label: formatMessageText(intl, {
        id: "appgenSiteDetail.navigation.automations",
        defaultMessage: "Automations",
        description: "Tab label for a Site's cloud scheduled tasks",
      }),
    },
    settings: {
      id: SETTINGS_PANEL_ID,
      label: formatMessageText(intl, {
        id: "appgenSiteDetail.navigation.settings",
        defaultMessage: "Settings",
        description: "Tab label for Site settings",
      }),
    },
    analytics: {
      id: ANALYTICS_PANEL_ID,
      label: formatMessageText(intl, {
        id: "appgenSiteDetail.navigation.analytics",
        defaultMessage: "Analytics",
        description: "Tab label for Site analytics",
      }),
    },
    database: {
      id: DATABASE_PANEL_ID,
      label: formatMessageText(intl, {
        id: "appgenSiteDetail.navigation.database",
        defaultMessage: "Database",
        description: "Tab label for the Site database viewer",
      }),
    },
  };
  return descriptors[selectedTab];
}

function formatMessageText(
  intl: IntlShape,
  descriptor: Parameters<IntlShape["formatMessage"]>[0],
): string {
  const value = intl.formatMessage(descriptor);
  return typeof value === "string" ? value : descriptor.defaultMessage ?? "";
}

function ignoreError() {}

function SiteDetailHeader({
  onBack,
  onEdit,
  site,
}: {
  onBack(): void;
  onEdit?: () => void;
  site?: AppgenSite;
}): unknown {
  const ancestors = [
    {
      id: "sites",
      label: jsx.jsx(FormattedMessage, {
        id: "appgenSiteDetail.header.sites",
        defaultMessage: "Sites",
        description: "Breadcrumb link from Site details back to Sites",
      }),
      onClick: onBack,
    },
  ];
  const breadcrumbs = jsx.jsx(ToolbarBreadcrumb, {
    ancestors,
    current: site?.title,
  });
  const editAction =
    site == null || onEdit == null
      ? null
      : jsx.jsx(EditSiteButton, { site, onEdit });
  return jsx.jsxs(Header, { children: [breadcrumbs, editAction] });
}

function SiteSummary({
  screenshotSrc,
  site,
}: {
  screenshotSrc?: string | null;
  site: AppgenSite;
}): unknown {
  const titleAndUrl = jsx.jsxs("div", {
    className: "flex min-w-0 flex-col gap-0.5",
    children: [
      jsx.jsx("h1", {
        className: "truncate text-xl leading-7 font-medium text-default",
        children: site.title,
      }),
      jsx.jsx("div", {
        className: "truncate text-xs text-tertiary",
        children: formatSiteHost(site.current_live_url) ?? site.slug,
      }),
    ],
  });
  const thumbnail =
    screenshotSrc == null
      ? jsx.jsx(SiteIcon, { "aria-hidden": true, className: "icon-md" })
      : jsx.jsx("img", {
          alt: "",
          className: "size-full object-cover",
          src: screenshotSrc,
        });
  const thumbnailFrame = jsx.jsxs("div", {
    className:
      "relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-secondary/92",
    children: [
      thumbnail,
      jsx.jsx("span", {
        "aria-hidden": true,
        className:
          "pointer-events-none absolute inset-0 rounded-md ring-1 ring-border ring-inset",
      }),
    ],
  });
  return jsx.jsxs("div", {
    className: "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3",
    children: [titleAndUrl, thumbnailFrame],
  });
}

function EditSiteButton({
  onEdit,
  site,
}: {
  onEdit(): void;
  site: AppgenSite;
}): unknown {
  const suspended = site.status === "suspended";
  const button = jsx.jsxs(Button, {
    color: "outline",
    disabled: suspended,
    size: "toolbar",
    onClick: onEdit,
    children: [
      jsx.jsx(IconAsset, { asset: editIconAsset }),
      jsx.jsx(FormattedMessage, {
        id: "appgenSiteDetail.edit",
        defaultMessage: "Edit",
        description: "Button label for editing a Site from its details page",
      }),
    ],
  });
  return suspended
    ? jsx.jsx(Tooltip, {
        interactive: site.disabled_by === "openai",
        tooltipContent: jsx.jsx(AppgenDisabledTooltip, {
          disabledBy: site.disabled_by,
        }),
        children: button,
      })
    : button;
}

function LoadingState() {
  return jsx.jsx("div", {
    className: "flex min-h-96 flex-1 items-center justify-center",
    children: jsx.jsx(LoadingSpinner, {}),
  });
}

function ErrorState() {
  return jsx.jsx(ErrorStateView, {
    className: "min-h-96 flex-1",
    title: jsx.jsx(FormattedMessage, {
      id: "appgenSiteDetail.error.title",
      defaultMessage: "Unable to load site",
      description: "Error state shown when Site details cannot load",
    }),
  });
}

function initializeAppgenSiteDetailLayout(): void {
  initializeRuntimeLazy();
  initializeMountedState();
  initializeSignalRuntime();
  React = resolveRuntime<ReactRuntime>(reactRuntimeExport);
  initializeSharedComponents();
  initializeGptResources();
  initializeHeaderLayout();
  initializeNavigationComponents();
  initializeButton();
  initializeIconAsset();
  initializeAppgenHeader();
  initializeResourceButton();
  initializeTabs();
  initializeBreadcrumb();
  initializeTooltip();
  initializeSiteComponents();
  initializeAppgenFeatureFlags();
  initializeSharedRuntime();
  initializeExperiments();
  initializeMigrationExperiment();
  initializeIntl();
  initializeAppgenAccess();
  initializeScreenshotQuery();
  initializeDisabledTooltip();
  initializeAppgenRouting();
  initializeAppgenConversation();
  initializeAppgenFormatting();
  initializeStartAppgenConversation();
  jsx = getJsxRuntime();
  ANALYTICS_PANEL_ID = "appgen-site-detail-analytics";
  DATABASE_PANEL_ID = "appgen-site-detail-database";
  AUTOMATIONS_PANEL_ID = "appgen-site-detail-automations";
  SETTINGS_PANEL_ID = "appgen-site-detail-settings";
  SiteContext = React.createContext(null);
}

function resolveRuntime<T>(value: unknown): T {
  return (typeof value === "function" ? value() : value) as T;
}

export { initializeAppgenSiteDetailLayout as n, AppgenSiteDetailLayout as t };
