// appgen-site-detail-route —— Site 详情页的标签路由与预取宿主。
// 原版：app/webview/assets/appgen-site-detail-route-74e1c1fb468e.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as detailLayoutChunk from "@rchunk/appgen-site-detail-layout";

void runtimeChunk;
const { $3: initializeRuntimeLazy, I3: getJsxRuntime } = appSharedChunk;
const {
  $gn: matchRoutePattern,
  GT: automationsRoute,
  JT: initializeAppgenRouteState,
  KT: databaseRoute,
  Qgn: initializeRouter,
  WT: analyticsRoute,
  Xgn: RouterOutlet,
  Ygn: Navigate,
  i_n: useRouterLocation,
  l_n: useRouteParameters,
  lnn: initializeAppgenQueries,
  qT: settingsRoute,
} = appInitialChunk;
const { n: initializeSiteDetailLayout, t: SiteDetailLayout } =
  detailLayoutChunk;
const jsx = getJsxRuntime();

type SiteDetailTab = "analytics" | "automations" | "database" | "settings";

function SiteDetailOutlet(): unknown {
  return jsx.jsx(RouterOutlet, {});
}

function prefetchSiteDetailTab(tab: SiteDetailTab): unknown {
  switch (tab) {
    case "analytics":
      return analyticsRoute.prefetch();
    case "database":
      return databaseRoute.prefetch();
    case "automations":
      return automationsRoute.prefetch();
    case "settings":
      return settingsRoute.prefetch();
  }
}

function AppgenSiteDetailRoute(): unknown {
  const { pathname } = useRouterLocation();
  const { projectId } = useRouteParameters();
  if (projectId == null) {
    return jsx.jsx(Navigate, { replace: true, to: "/sites" });
  }

  let selectedTab: SiteDetailTab = "analytics";
  if (matchRoutePattern("/sites/:projectId/settings", pathname) != null) {
    selectedTab = "settings";
  } else if (
    matchRoutePattern("/sites/:projectId/automations", pathname) != null
  ) {
    selectedTab = "automations";
  } else if (
    matchRoutePattern("/sites/:projectId/database", pathname) != null
  ) {
    selectedTab = "database";
  }

  return jsx.jsx(SiteDetailLayout, {
    prefetchTab: prefetchSiteDetailTab,
    projectId,
    selectedTab,
    children: SiteDetailOutlet,
  });
}

function initializeAppgenSiteDetailRoute(): void {
  initializeRuntimeLazy();
  initializeRouter();
  initializeAppgenRouteState();
  initializeAppgenQueries();
  initializeSiteDetailLayout();
}

initializeAppgenSiteDetailRoute();

export { AppgenSiteDetailRoute };
