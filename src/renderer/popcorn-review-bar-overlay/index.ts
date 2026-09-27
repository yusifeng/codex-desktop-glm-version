import { I3 as getJsxRuntime } from "@rchunk/app-shared";

export interface PopcornReviewBarOverlayProps {
  children?: unknown;
  viewportInsets?: Record<string, string | number | undefined>;
}

function PopcornReviewBarOverlay({
  children,
  viewportInsets,
}: PopcornReviewBarOverlayProps): unknown {
  const { jsx } = getJsxRuntime();
  return jsx("div", {
    className: "popcorn-review-bar-overlay",
    "data-popcorn-review-bar": "true",
    style: viewportInsets,
    children: jsx("div", {
      className: "popcorn-review-bar-overlay-content",
      children,
    }),
  });
}

function initializePopcornReviewBarOverlay(): void {
  getJsxRuntime();
}

export { initializePopcornReviewBarOverlay as n, PopcornReviewBarOverlay as t };
