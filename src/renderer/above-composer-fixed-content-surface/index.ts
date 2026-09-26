// above-composer-fixed-content-surface —— Composer 上方固定内容的胶囊容器。
// 原版：app/webview/assets/above-composer-fixed-content-surface-59cfe2f3858a.js。

import "@rchunk/app-shared";

export interface AboveComposerFixedContentSurfaceProps<T = unknown> {
  children: T;
  transition?: unknown;
}

export interface AboveComposerFixedContentSurfaceView<T = unknown> {
  kind: "above-composer-fixed-content-surface";
  outerClassName: string;
  motion: {
    layout: "size";
    transition?: unknown;
    className: string;
  };
  surface: {
    className: string;
    children: T;
  };
}

const OUTER_CLASS = "flex w-full max-w-(--thread-content-max-width) min-w-0 justify-center";
const MOTION_CLASS = "relative z-10 w-fit max-w-full min-w-0 overflow-hidden rounded-3xl";
const SURFACE_CLASS =
  "flex w-max max-w-full min-w-0 items-center gap-2 rounded-3xl border border-border/80 bg-background-primary-soft/70 px-3 py-1.5 text-default backdrop-blur-sm";

function AboveComposerFixedContentSurface<T>(
  props: AboveComposerFixedContentSurfaceProps<T>,
): AboveComposerFixedContentSurfaceView<T> {
  return {
    kind: "above-composer-fixed-content-surface",
    outerClassName: OUTER_CLASS,
    motion: { layout: "size", transition: props.transition, className: MOTION_CLASS },
    surface: { className: SURFACE_CLASS, children: props.children },
  };
}

function initializeAboveComposerFixedContentSurface(): void {}

export {
  initializeAboveComposerFixedContentSurface as n,
  AboveComposerFixedContentSurface as t,
};
