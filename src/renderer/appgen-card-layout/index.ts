// appgen-card-layout —— Sites 网格与列表卡片的共享布局原语。
// 原版：app/webview/assets/layout-5d9c2c65a7ad.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
let jsx: any;

function AppgenCardThumbnail(props: any) {
  const {
    children,
    className,
    aspectRatio = "square",
    viewMode,
    ...rest
  } = props;
  const sizeClass = viewMode === "list" ? "h-[50px] w-20" : "w-full";
  const aspectClass =
    viewMode === "grid" &&
    (aspectRatio === "landscape" ? "aspect-230/150" : "aspect-square");
  return jsx.jsx("div", {
    className: appShared.m4(
      "relative shrink-0 overflow-hidden",
      sizeClass,
      aspectClass,
      className,
    ),
    ...rest,
    children,
  });
}

function AppgenCardTitle(props: any) {
  const { className, viewMode, ...rest } = props;
  const typography =
    viewMode === "list" ? "text-sm leading-5" : "text-xs leading-[18px]";
  return jsx.jsx("div", {
    className: appShared.m4(
      "truncate font-medium text-default",
      typography,
      className,
    ),
    ...rest,
  });
}

function AppgenCardDescription(props: any) {
  const { className, ...rest } = props;
  return jsx.jsx("div", {
    className: appShared.m4("text-xs leading-[18px] text-secondary", className),
    ...rest,
  });
}

function AppgenCardActions(props: any) {
  const { className, ...rest } = props;
  return jsx.jsx("div", {
    className: appShared.m4(
      "pointer-events-auto relative z-10 flex items-center gap-2 ps-4 [@container_(max-width:420px)]:gap-1 [@container_(max-width:420px)]:ps-2",
      className,
    ),
    ...rest,
  });
}

function initializeAppgenCardLayout(): void {
  appShared.$3();
  appShared.h4();
  appShared.Zh();
  appShared.C_();
  appShared.c_();
  jsx = appShared.I3();
}

export {
  initializeAppgenCardLayout as a,
  AppgenCardActions as i,
  AppgenCardThumbnail as n,
  AppgenCardTitle as r,
  AppgenCardDescription as t,
};
