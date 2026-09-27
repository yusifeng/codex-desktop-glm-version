// option-carousel —— 首页公告与表单选项的横向轮播控件。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

void appInitialChunk;
void runtimeChunk;

interface AppSharedBindings {
  I3: JsxRuntime | (() => JsxRuntime);
}

export interface OptionCarouselProps {
  ariaInvalid?: boolean;
  ariaLabel?: string;
  backLabel: string;
  children?: unknown;
  forwardLabel: string;
  header?: unknown;
  layout?: "form" | "gallery";
  role?: string;
  shouldUseReducedMotion?: boolean;
}

const { I3: jsxRuntimeExport } = appSharedChunk as unknown as AppSharedBindings;
let jsx: JsxRuntime;

function getScrollBounds(element: HTMLElement): {
  maximum: number;
  minimum: number;
} {
  return {
    maximum: Math.max(0, element.scrollWidth - element.clientWidth),
    minimum: 0,
  };
}

function getNextScrollLeft(element: HTMLElement, direction: -1 | 1): number {
  const distance = Math.max(element.clientWidth * 0.8, 160);
  const { maximum, minimum } = getScrollBounds(element);
  return Math.min(maximum, Math.max(minimum, element.scrollLeft + direction * distance));
}

function OptionCarousel({
  ariaInvalid,
  ariaLabel,
  backLabel,
  children,
  forwardLabel,
  header,
  layout = "form",
  role = "group",
  shouldUseReducedMotion = false,
}: OptionCarouselProps): unknown {
  initializeOptionCarousel();
  let viewport: HTMLElement | null = null;
  const scroll = (direction: -1 | 1) => {
    if (viewport == null) return;
    viewport.scrollTo({
      behavior: shouldUseReducedMotion ? "auto" : "smooth",
      left: getNextScrollLeft(viewport, direction),
    });
  };
  const gallery = layout === "gallery";
  return jsx.jsxs("section", {
    "aria-invalid": ariaInvalid,
    "aria-label": ariaLabel,
    className: `option-carousel option-carousel--${layout}`,
    role,
    children: [
      jsx.jsxs("header", {
        className: "option-carousel__header",
        children: [
          jsx.jsx("div", { className: "option-carousel__title", children: header }),
          jsx.jsxs("div", {
            className: "option-carousel__controls",
            children: [
              jsx.jsx("button", {
                "aria-label": backLabel,
                className: gallery ? "option-carousel__button--outlined" : undefined,
                onClick: () => scroll(-1),
                title: backLabel,
                type: "button",
                children: "‹",
              }),
              jsx.jsx("button", {
                "aria-label": forwardLabel,
                className: gallery ? "option-carousel__button--outlined" : undefined,
                onClick: () => scroll(1),
                title: forwardLabel,
                type: "button",
                children: "›",
              }),
            ],
          }),
        ],
      }),
      jsx.jsx("div", {
        className: "option-carousel__viewport",
        ref: (element: HTMLElement | null) => {
          viewport = element;
        },
        children,
      }),
    ],
  });
}

function initializeOptionCarousel(): void {
  if (jsx != null) return;
  jsx = typeof jsxRuntimeExport === "function" ? jsxRuntimeExport() : jsxRuntimeExport;
}

initializeOptionCarousel();

export { initializeOptionCarousel as n, OptionCarousel as t };
