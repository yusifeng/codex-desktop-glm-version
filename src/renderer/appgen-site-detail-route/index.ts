// appgen-site-detail-route —— Site 详情页的标签路由与预取宿主。
// 原版：app/webview/assets/appgen-site-detail-route-74e1c1fb468e.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as detailLayoutChunk from "@rchunk/appgen-site-detail-layout";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const detailLayout = detailLayoutChunk as Record<string, any>;
const jsx = appShared.I3();

function SiteDetailOutlet() {
  return jsx.jsx(appInitial.Xgn, {});
}

function prefetchSiteDetailTab(tab: string) {
  switch (tab) {
    case "analytics":
      return appInitial.WT.prefetch();
    case "database":
      return appInitial.KT.prefetch();
    case "automations":
      return appInitial.GT.prefetch();
    case "settings":
      return appInitial.qT.prefetch();
  }
}

function AppgenSiteDetailRoute() {
  const { pathname } = appInitial.i_n();
  const { projectId } = appInitial.l_n();
  if (projectId == null) {
    return jsx.jsx(appInitial.Ygn, { replace: true, to: "/sites" });
  }

  let selectedTab = "analytics";
  if (appInitial.$gn("/sites/:projectId/settings", pathname) != null) {
    selectedTab = "settings";
  } else if (
    appInitial.$gn("/sites/:projectId/automations", pathname) != null
  ) {
    selectedTab = "automations";
  } else if (appInitial.$gn("/sites/:projectId/database", pathname) != null) {
    selectedTab = "database";
  }

  return jsx.jsx(detailLayout.t, {
    prefetchTab: prefetchSiteDetailTab,
    projectId,
    selectedTab,
    children: SiteDetailOutlet,
  });
}

function initializeAppgenSiteDetailRoute(): void {
  appShared.$3?.();
  appInitial.Qgn?.();
  appInitial.JT?.();
  appInitial.lnn?.();
  detailLayout.n?.();
}

initializeAppgenSiteDetailRoute();

export { AppgenSiteDetailRoute };
