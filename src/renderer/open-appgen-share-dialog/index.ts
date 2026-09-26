// open-appgen-share-dialog —— 预加载并打开 Site 分享弹窗。
// 原版：app/webview/assets/open-appgen-share-dialog-adecffea4fba.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type {
  MaitaiScopeApi,
  SitesSharingSource,
} from "@rchunk/app-shared";

void runtimeChunk;
const {
  EF: sitesSharingEvent,
  H3: initializeModulePreload,
  TF: sitesSharingActions,
  V3: preloadModule,
  fI: initializeIntlRuntime,
} = appSharedChunk;
const {
  Uzt: openLazyDialog,
  Vzt: initializeDialogLauncher,
  xpn: emitAnalyticsEvent,
  ypn: initializeAnalyticsEmitter,
} = appInitialChunk;

const shareDialogDependencies = [
  "./appgen-share-dialog-5fd465534630.js",
  "./rolldown-runtime-2d059c5e81f4.js",
  "./app-shared-7b9edc1bfb7f.js",
  "./app-shared-fa570b9eb9dd.css",
  "./app-initial-51da50e6c6e3.js",
  "./app-initial-e8ceb32eb626.css",
  "./appgen-access-50974c702eaf.js",
  "./appgen-site-card-230b77db57a9.js",
  "./app-primary-d66705000d76.js",
  "./app-primary-484df789f2f5.css",
  "./dialog-action-9fe7be84d34e.js",
  "./permission-dropdown-faa59c51006d.js",
];

interface OpenAppgenShareDialogOptions extends Record<string, unknown> {
  source: SitesSharingSource;
}

function openAppgenShareDialog(
  scope: MaitaiScopeApi<Record<string, unknown>>,
  projectId: string,
  options: OpenAppgenShareDialogOptions,
): void {
  const loadDialog = async () => {
    const { AppgenShareDialog } = await import("@rchunk/appgen-share-dialog");
    return { AppgenShareDialog };
  };
  preloadModule(loadDialog, shareDialogDependencies, import.meta.url).then(
    ({ AppgenShareDialog }) => {
      try {
        emitAnalyticsEvent(scope, sitesSharingEvent, {
          action: sitesSharingActions.CODEX_SITES_SHARING_ACTION_OPENED,
          projectId,
          source: options.source,
        });
      } catch {}
      openLazyDialog(scope, AppgenShareDialog, { projectId, ...options });
    },
  );
}

function initializeOpenAppgenShareDialog(): void {
  initializeIntlRuntime();
  initializeDialogLauncher();
  initializeAnalyticsEmitter();
  initializeModulePreload();
}

export { openAppgenShareDialog as n, initializeOpenAppgenShareDialog as t };
