// appgen-card-layout —— Sites 网格与列表卡片的共享布局原语。
// 原版：app/webview/assets/layout-5d9c2c65a7ad.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeReactRuntime,
  C_: initializeCardActions,
  I3: getJsxRuntime,
  Zh: initializeButton,
  c_: initializeCardTypography,
  h4: initializeImageComponent,
  m4: classNames,
} = appSharedChunk;
let jsx: JsxRuntime;

interface AppgenCardElementProps extends Record<string, unknown> {
  children?: unknown;
  className?: string;
}

interface AppgenCardThumbnailProps extends AppgenCardElementProps {
  aspectRatio?: "landscape" | "square" | string;
  viewMode: "grid" | "list";
}

interface AppgenCardTitleProps extends AppgenCardElementProps {
  viewMode: "grid" | "list";
}

function AppgenCardThumbnail(props: AppgenCardThumbnailProps): unknown {
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
    className: classNames(
      "relative shrink-0 overflow-hidden",
      sizeClass,
      aspectClass,
      className,
    ),
    ...rest,
    children,
  });
}

function AppgenCardTitle(props: AppgenCardTitleProps): unknown {
  const { className, viewMode, ...rest } = props;
  const typography =
    viewMode === "list" ? "text-sm leading-5" : "text-xs leading-[18px]";
  return jsx.jsx("div", {
    className: classNames(
      "truncate font-medium text-default",
      typography,
      className,
    ),
    ...rest,
  });
}

function AppgenCardDescription(props: AppgenCardElementProps): unknown {
  const { className, ...rest } = props;
  return jsx.jsx("div", {
    className: classNames("text-xs leading-[18px] text-secondary", className),
    ...rest,
  });
}

function AppgenCardActions(props: AppgenCardElementProps): unknown {
  const { className, ...rest } = props;
  return jsx.jsx("div", {
    className: classNames(
      "pointer-events-auto relative z-10 flex items-center gap-2 ps-4 [@container_(max-width:420px)]:gap-1 [@container_(max-width:420px)]:ps-2",
      className,
    ),
    ...rest,
  });
}

function initializeAppgenCardLayout(): void {
  initializeReactRuntime();
  initializeImageComponent();
  initializeButton();
  initializeCardActions();
  initializeCardTypography();
  jsx = getJsxRuntime();
}

export {
  initializeAppgenCardLayout as a,
  AppgenCardActions as i,
  AppgenCardThumbnail as n,
  AppgenCardTitle as r,
  AppgenCardDescription as t,
};
