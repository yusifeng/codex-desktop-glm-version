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

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const tabs = tabsChunk as Record<string, any>;
const breadcrumb = breadcrumbChunk as Record<string, any>;
const appgenAccess = appgenAccessChunk as Record<string, any>;
const disabledTooltip = disabledTooltipChunk as Record<string, any>;
const startConversation = startConversationChunk as Record<string, any>;

let React: any;
let jsx: any;
let SiteContext: any;
let ANALYTICS_PANEL_ID: string;
let DATABASE_PANEL_ID: string;
let AUTOMATIONS_PANEL_ID: string;
let SETTINGS_PANEL_ID: string;

function AppgenSiteDetailLayout(props: any) {
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
}: any) {
  const scope = appShared.LX(appShared.ZI);
  const navigate = appInitial.o_n();
  const intl = appShared.n4();
  const isMounted = appShared.if();
  const navigationSequence = React.useRef(0);
  const startConversationFromHome = appInitial.h2();
  const automationsEnabled = appInitial.ofn("282477705");
  const automationsFlagLoading = appInitial.sfn("282477705");
  const automationsAvailabilityLoading = appShared.HX(appInitial.vfn);
  const analyticsEnabled = appInitial.ofn("262557526");
  const databaseEnabled = appInitial.ofn("1912312436");
  const { data: databaseAvailability, isError: databaseAvailabilityError } =
    appShared.HX(appInitial.can, { enabled: databaseEnabled });
  const {
    data: site,
    isError: siteError,
    isLoading: siteLoading,
  } = appShared.BX(appInitial.aan, projectId);
  const canManageSite = appgenAccess.t(site);

  const trackPageView = React.useEffectEvent(() => {
    let page;
    switch (selectedTab) {
      case "automations":
        return;
      case "analytics":
        page = appShared.Vk.CODEX_APPGEN_INTERACTION_PAGE_ANALYTICS;
        break;
      case "database":
        page = appShared.Vk.CODEX_APPGEN_INTERACTION_PAGE_DATABASE;
        break;
      case "settings":
        page = appShared.Vk.CODEX_APPGEN_INTERACTION_PAGE_SETTINGS;
    }
    appInitial.Pan(scope, {
      action: appShared.Bk.CODEX_APPGEN_INTERACTION_ACTION_PAGE_VIEWED,
      page,
      projectId,
      source: appShared.Hk.CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS,
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

  const { data: screenshotSrc } = appInitial.wan(site?.screenshot_url ?? null);
  const liveUrl = site?.status === "suspended" ? null : site?.current_live_url;

  if (site != null && selectedTab === "settings" && !canManageSite) {
    return jsx.jsx(appInitial.Ygn, { replace: true, to: appInitial.enn });
  }
  if (
    selectedTab === "automations" &&
    (automationsAvailabilityLoading || automationsFlagLoading)
  ) {
    return jsx.jsx(appShared.Qh, {});
  }
  if (
    selectedTab === "automations" &&
    (!automationsEnabled || (site != null && !canManageSite))
  ) {
    return jsx.jsx(appInitial.Ygn, {
      replace: true,
      to: appInitial.cnn(projectId),
    });
  }

  const tabItems = [
    {
      key: "settings",
      name: jsx.jsx(appShared.Y2, {
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
      name: jsx.jsx(appShared.Y2, {
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
      name: jsx.jsx(appShared.Y2, {
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
      name: jsx.jsx(appShared.Y2, {
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
          appInitial.Pan(scope, {
            action:
              appShared.Bk
                .CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED,
            projectId: site.id,
            source: appShared.Hk.CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS,
          });
          startConversation.n(scope, startConversationFromHome, {
            type: "edit",
            liveUrl,
            projectId: site.id,
            projectTitle: site.title,
            latestEditContext: site.latest_edit_context,
          });
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
    const selectTab = (tab: string) => {
      let destination;
      switch (tab) {
        case "automations":
          destination = appInitial.ann(projectId);
          break;
        case "settings":
          destination = appInitial.cnn(projectId);
          break;
        case "analytics":
          destination = appInitial.inn(projectId);
          break;
        case "database":
          destination = appInitial.onn(projectId);
      }
      const sequence = (navigationSequence.current += 1);
      (prefetchTab?.(tab) ?? Promise.resolve()).catch(ignoreError).then(() => {
        if (isMounted() && sequence === navigationSequence.current)
          navigate(destination);
      });
    };
    const tabNavigation = jsx.jsx("div", {
      className: "border-b border-subtle pb-6",
      children: jsx.jsx(tabs.t, {
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
        children: jsx.jsx(appInitial.m7, { children: header }),
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

function getSelectedPanel(selectedTab: string, intl: any) {
  const descriptors: Record<string, { id: string; label: string }> = {
    automations: {
      id: AUTOMATIONS_PANEL_ID,
      label: intl.formatMessage({
        id: "appgenSiteDetail.navigation.automations",
        defaultMessage: "Automations",
        description: "Tab label for a Site's cloud scheduled tasks",
      }),
    },
    settings: {
      id: SETTINGS_PANEL_ID,
      label: intl.formatMessage({
        id: "appgenSiteDetail.navigation.settings",
        defaultMessage: "Settings",
        description: "Tab label for Site settings",
      }),
    },
    analytics: {
      id: ANALYTICS_PANEL_ID,
      label: intl.formatMessage({
        id: "appgenSiteDetail.navigation.analytics",
        defaultMessage: "Analytics",
        description: "Tab label for Site analytics",
      }),
    },
    database: {
      id: DATABASE_PANEL_ID,
      label: intl.formatMessage({
        id: "appgenSiteDetail.navigation.database",
        defaultMessage: "Database",
        description: "Tab label for the Site database viewer",
      }),
    },
  };
  return descriptors[selectedTab];
}

function ignoreError() {}

function SiteDetailHeader({ onBack, onEdit, site }: any) {
  const ancestors = [
    {
      id: "sites",
      label: jsx.jsx(appShared.Y2, {
        id: "appgenSiteDetail.header.sites",
        defaultMessage: "Sites",
        description: "Breadcrumb link from Site details back to Sites",
      }),
      onClick: onBack,
    },
  ];
  const breadcrumbs = jsx.jsx(breadcrumb.t, {
    ancestors,
    current: site?.title,
  });
  const editAction =
    site == null || onEdit == null
      ? null
      : jsx.jsx(EditSiteButton, { site, onEdit });
  return jsx.jsxs(appInitial.B9, { children: [breadcrumbs, editAction] });
}

function SiteSummary({ screenshotSrc, site }: any) {
  const titleAndUrl = jsx.jsxs("div", {
    className: "flex min-w-0 flex-col gap-0.5",
    children: [
      jsx.jsx("h1", {
        className: "truncate text-xl leading-7 font-medium text-default",
        children: site.title,
      }),
      jsx.jsx("div", {
        className: "truncate text-xs text-tertiary",
        children: appPrimary.xf(site.current_live_url) ?? site.slug,
      }),
    ],
  });
  const thumbnail =
    screenshotSrc == null
      ? jsx.jsx(appInitial.i3t, { "aria-hidden": true, className: "icon-md" })
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

function EditSiteButton({ onEdit, site }: any) {
  const suspended = site.status === "suspended";
  const button = jsx.jsxs(appShared.Yh, {
    color: "outline",
    disabled: suspended,
    size: "toolbar",
    onClick: onEdit,
    children: [
      jsx.jsx(appShared.S_, { asset: appShared.jT }),
      jsx.jsx(appShared.Y2, {
        id: "appgenSiteDetail.edit",
        defaultMessage: "Edit",
        description: "Button label for editing a Site from its details page",
      }),
    ],
  });
  return suspended
    ? jsx.jsx(appShared.o_, {
        interactive: site.disabled_by === "openai",
        tooltipContent: jsx.jsx(disabledTooltip.t, {
          disabledBy: site.disabled_by,
        }),
        children: button,
      })
    : button;
}

function LoadingState() {
  return jsx.jsx("div", {
    className: "flex min-h-96 flex-1 items-center justify-center",
    children: jsx.jsx(appShared.Qh, {}),
  });
}

function ErrorState() {
  return jsx.jsx(appInitial.ket, {
    className: "min-h-96 flex-1",
    title: jsx.jsx(appShared.Y2, {
      id: "appgenSiteDetail.error.title",
      defaultMessage: "Unable to load site",
      description: "Error state shown when Site details cannot load",
    }),
  });
}

function initializeAppgenSiteDetailLayout(): void {
  appShared.$3();
  appShared.AT();
  appShared.FX();
  React = appShared.e6();
  appShared.K2();
  appInitial.Qgn();
  appInitial.h7();
  appInitial.V9();
  appShared.Zh();
  appShared.C_();
  appInitial.Aet();
  appShared.$h();
  tabs.n();
  breadcrumb.n();
  appShared.c_();
  appInitial.d2();
  appInitial.a3t();
  appShared.QI();
  appInitial.ifn();
  appInitial.pfn();
  appShared.rf();
  appgenAccess.s();
  appInitial.Nan();
  disabledTooltip.n();
  appInitial._an();
  appInitial.lnn();
  appPrimary.Sf();
  startConversation.t();
  jsx = appShared.I3();
  ANALYTICS_PANEL_ID = "appgen-site-detail-analytics";
  DATABASE_PANEL_ID = "appgen-site-detail-database";
  AUTOMATIONS_PANEL_ID = "appgen-site-detail-automations";
  SETTINGS_PANEL_ID = "appgen-site-detail-settings";
  SiteContext = React.createContext(null);
}

export { initializeAppgenSiteDetailLayout as n, AppgenSiteDetailLayout as t };
