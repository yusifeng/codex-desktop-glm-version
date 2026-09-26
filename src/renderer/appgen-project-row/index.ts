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

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appgenAccess = appgenAccessChunk as Record<string, any>;
const accessStateMessages = accessStateMessagesChunk as Record<string, any>;
const cardLayout = cardLayoutChunk as Record<string, any>;
const openShareDialog = openShareDialogChunk as Record<string, any>;
const defaultThumbnail = defaultThumbnailChunk as Record<string, any>;
let jsx: any;
let styles: Record<string, string>;

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
  const { platform } = appInitial.E6t();
  const ThumbnailAsset =
    platform === "windows" ? defaultThumbnail.r : defaultThumbnail.t;
  const assetClassName =
    viewMode === "list" ? styles.listAsset : styles.gridAsset;
  const sizeClassName = viewMode === "list" ? "size-full" : "h-auto w-[72%]";
  return jsx.jsx(cardLayout.n, {
    className: "flex items-center justify-center",
    aspectRatio,
    viewMode,
    children: jsx.jsx(ThumbnailAsset, {
      "aria-hidden": true,
      className: appShared.m4(assetClassName, sizeClassName),
    }),
  });
}

function AppgenProjectThumbnail({
  aspectRatio,
  screenshotUrl,
  viewMode,
}: {
  aspectRatio?: string;
  screenshotUrl?: string | null;
  viewMode: "list" | "grid";
}) {
  const { data: screenshotSrc } = appInitial.wan(screenshotUrl);
  if (screenshotSrc == null) {
    return jsx.jsx(DefaultSiteThumbnail, { aspectRatio, viewMode });
  }
  return jsx.jsx(cardLayout.n, {
    className: "flex items-center justify-center",
    aspectRatio,
    viewMode,
    children: jsx.jsx("img", {
      alt: "",
      className: appShared.m4(
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
  appShared.$3?.();
  appShared.h4?.();
  appShared.FX?.();
  appInitial.Dft?.();
  appInitial.a7?.();
  appInitial.RS?.();
  appInitial.T6t?.();
  appInitial.yZ?.();
  cardLayout.a?.();
  appShared.QI?.();
  appgenAccess.s?.();
  accessStateMessages.o?.();
  accessStateMessages.i?.();
  defaultThumbnail.o?.();
  appInitial._an?.();
  openShareDialog.t?.();
  defaultThumbnail.i?.();
  defaultThumbnail.n?.();
  initializeStyles();
  jsx = appShared.I3();
}

export { initializeAppgenProjectRow as n, AppgenProjectThumbnail as t };
