// appgen-card-layout —— Sites 网格与列表卡片的共享布局原语。
// 原版：app/webview/assets/layout-5d9c2c65a7ad.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: getCompilerRuntime,
  C_: initializeCardActions,
  I3: getJsxRuntime,
  Zh: initializeButton,
  c_: initializeCardTypography,
  h4: initializeImageComponent,
  m4: classNames,
} = appSharedChunk;
let jsx: JsxRuntime;
interface CompilerRuntime { c(size: number): unknown[] }
let compilerRuntime: CompilerRuntime;

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
  const cache = compilerRuntime.c(14);
  let children: unknown;
  let className: string | undefined;
  let aspectRatioValue: string | undefined;
  let viewMode: "grid" | "list";
  let rest: Record<string, unknown>;
  if (cache[0] === props) {
    children = cache[1];
    className = cache[2] as string | undefined;
    rest = cache[3] as Record<string, unknown>;
    aspectRatioValue = cache[4] as string | undefined;
    viewMode = cache[5] as "grid" | "list";
  } else {
    ({ children, className, aspectRatio: aspectRatioValue, viewMode, ...rest } = props);
    cache[0] = props; cache[1] = children; cache[2] = className; cache[3] = rest;
    cache[4] = aspectRatioValue; cache[5] = viewMode;
  }
  const aspectRatio = aspectRatioValue ?? "square";
  const sizeClass = viewMode === "list" ? "h-[50px] w-20" : "w-full";
  const aspectClass =
    viewMode === "grid" &&
    (aspectRatio === "landscape" ? "aspect-230/150" : "aspect-square");
  let mergedClassName: string;
  if (cache[6] !== className || cache[7] !== sizeClass || cache[8] !== aspectClass) {
    mergedClassName = classNames(
      "relative shrink-0 overflow-hidden",
      sizeClass,
      aspectClass,
      className,
    );
    cache[6] = className; cache[7] = sizeClass; cache[8] = aspectClass; cache[9] = mergedClassName;
  } else mergedClassName = cache[9] as string;
  if (cache[10] !== children || cache[11] !== rest || cache[12] !== mergedClassName) {
    cache[10] = children; cache[11] = rest; cache[12] = mergedClassName;
    cache[13] = jsx.jsx("div", { className: mergedClassName, ...rest, children });
  }
  return cache[13];
}

function AppgenCardTitle(props: AppgenCardTitleProps): unknown {
  const cache = compilerRuntime.c(10);
  let className: string | undefined;
  let viewMode: "grid" | "list";
  let rest: Record<string, unknown>;
  if (cache[0] === props) {
    className = cache[1] as string | undefined; rest = cache[2] as Record<string, unknown>;
    viewMode = cache[3] as "grid" | "list";
  } else {
    ({ className, viewMode, ...rest } = props);
    cache[0] = props; cache[1] = className; cache[2] = rest; cache[3] = viewMode;
  }
  const typography =
    viewMode === "list" ? "text-sm leading-5" : "text-xs leading-[18px]";
  let mergedClassName: string;
  if (cache[4] !== className || cache[5] !== typography) {
    mergedClassName = classNames("truncate font-medium text-default", typography, className);
    cache[4] = className; cache[5] = typography; cache[6] = mergedClassName;
  } else mergedClassName = cache[6] as string;
  if (cache[7] !== rest || cache[8] !== mergedClassName) {
    cache[7] = rest; cache[8] = mergedClassName;
    cache[9] = jsx.jsx("div", { className: mergedClassName, ...rest });
  }
  return cache[9];
}

function AppgenCardDescription(props: AppgenCardElementProps): unknown {
  return renderSimpleCardElement(
    compilerRuntime.c(8), props, "text-xs leading-[18px] text-secondary",
  );
}

function AppgenCardActions(props: AppgenCardElementProps): unknown {
  return renderSimpleCardElement(
    compilerRuntime.c(8), props,
    "pointer-events-auto relative z-10 flex items-center gap-2 ps-4 [@container_(max-width:420px)]:gap-1 [@container_(max-width:420px)]:ps-2",
  );
}

function renderSimpleCardElement(
  cache: unknown[], props: AppgenCardElementProps, baseClassName: string,
): unknown {
  let className: string | undefined;
  let rest: Record<string, unknown>;
  if (cache[0] === props) {
    className = cache[1] as string | undefined; rest = cache[2] as Record<string, unknown>;
  } else {
    ({ className, ...rest } = props);
    cache[0] = props; cache[1] = className; cache[2] = rest;
  }
  let mergedClassName: string;
  if (cache[3] === className) mergedClassName = cache[4] as string;
  else {
    mergedClassName = classNames(baseClassName, className);
    cache[3] = className; cache[4] = mergedClassName;
  }
  if (cache[5] !== rest || cache[6] !== mergedClassName) {
    cache[5] = rest; cache[6] = mergedClassName;
    cache[7] = jsx.jsx("div", { className: mergedClassName, ...rest });
  }
  return cache[7];
}

function initializeAppgenCardLayout(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
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
