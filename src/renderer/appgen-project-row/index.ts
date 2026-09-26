// appgen-project-row —— Site 项目行/网格使用的截图缩略图。
// 原版：app/webview/assets/appgen-project-row-4cd40a4dcdf9.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appgenAccessChunk from "@rchunk/appgen-access";
import * as accessStateMessagesChunk from "@rchunk/appgen-access-state-messages";
import * as cardLayoutChunk from "@rchunk/appgen-card-layout";
import * as openShareDialogChunk from "@rchunk/open-appgen-share-dialog";
import * as defaultThumbnailChunk from "@rchunk/sites-default-thumbnail";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeReactRuntime,
  FX: initializeMaitaiRuntime,
  I3: getJsxRuntime,
  QI: initializeImageRuntime,
  h4: initializeImageComponent,
  m4: classNames,
} = appSharedChunk;
const {
  Dft: initializeLinkNavigation,
  E6t: getDesktopPlatform,
  RS: initializeProjectAccess,
  T6t: initializeSiteMetadata,
  _an: initializeAppgenQueries,
  a7: initializeSiteRoutes,
  wan: useAppgenScreenshotSrc,
  yZ: initializeImageLoading,
} = appInitialChunk;
const { s: initializeAppgenAccess } = appgenAccessChunk;
const {
  i: initializeAccessStateIcons,
  o: initializeAccessStateMessages,
} = accessStateMessagesChunk;
const {
  a: initializeCardLayout,
  n: AppgenCardThumbnailLayout,
} = cardLayoutChunk;
const { t: initializeOpenShareDialog } = openShareDialogChunk;
const {
  i: initializeMacThumbnail,
  n: initializeWindowsThumbnail,
  o: initializeDefaultThumbnailRuntime,
  r: WindowsDefaultThumbnail,
  t: MacDefaultThumbnail,
} = defaultThumbnailChunk;
let jsx: JsxRuntime;
let styles: Record<string, string>;

interface AppgenProjectThumbnailProps {
  aspectRatio?: string;
  screenshotUrl?: string | null;
  viewMode: "list" | "grid";
}

function initializeStyles(): void {
  styles = {
    openButton: "_openButton_1l7k7_2",
    listAsset: "_listAsset_1l7k7_2",
    gridAsset: "_gridAsset_1l7k7_2",
  };
}

function DefaultSiteThumbnail({
  aspectRatio,
  viewMode,
}: {
  aspectRatio?: string;
  viewMode: "list" | "grid";
}) {
  const { platform } = getDesktopPlatform();
  const ThumbnailAsset =
    platform === "windows" ? WindowsDefaultThumbnail : MacDefaultThumbnail;
  const assetClassName =
    viewMode === "list" ? styles.listAsset : styles.gridAsset;
  const sizeClassName = viewMode === "list" ? "size-full" : "h-auto w-[72%]";
  return jsx.jsx(AppgenCardThumbnailLayout, {
    className: "flex items-center justify-center",
    aspectRatio,
    viewMode,
    children: jsx.jsx(ThumbnailAsset, {
      "aria-hidden": true,
      className: classNames(assetClassName, sizeClassName),
    }),
  });
}

function AppgenProjectThumbnail({
  aspectRatio,
  screenshotUrl,
  viewMode,
}: AppgenProjectThumbnailProps) {
  const { data: screenshotSrc } = useAppgenScreenshotSrc(screenshotUrl);
  if (screenshotSrc == null) {
    return jsx.jsx(DefaultSiteThumbnail, { aspectRatio, viewMode });
  }
  return jsx.jsx(AppgenCardThumbnailLayout, {
    className: "flex items-center justify-center",
    aspectRatio,
    viewMode,
    children: jsx.jsx("img", {
      alt: "",
      className: classNames(
        viewMode === "list" ? styles.listAsset : styles.gridAsset,
        viewMode === "grid"
          ? "max-h-[72%] max-w-[72%]"
          : "max-h-full max-w-full",
        "object-contain",
      ),
      loading: "lazy",
      src: screenshotSrc,
    }),
  });
}

function initializeAppgenProjectRow(): void {
  initializeReactRuntime();
  initializeImageComponent();
  initializeMaitaiRuntime();
  initializeLinkNavigation();
  initializeSiteRoutes();
  initializeProjectAccess();
  initializeSiteMetadata();
  initializeImageLoading();
  initializeCardLayout();
  initializeImageRuntime();
  initializeAppgenAccess();
  initializeAccessStateMessages();
  initializeAccessStateIcons();
  initializeDefaultThumbnailRuntime();
  initializeAppgenQueries();
  initializeOpenShareDialog();
  initializeMacThumbnail();
  initializeWindowsThumbnail();
  initializeStyles();
  jsx = getJsxRuntime();
}

export { initializeAppgenProjectRow as n, AppgenProjectThumbnail as t };
