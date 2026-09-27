export interface ReviewDiffVirtualizerMetrics {
  diffHeaderHeight: number;
  hunkLineCount: number;
  hunkSeparatorHeight: number;
  lineHeight: number;
  paddingBottom?: number;
  paddingTop?: number;
  spacing: number;
}

const BASE_FONT_SIZE = 12;
const BASE_LINE_HEIGHT = 18;

function createDefaultMetrics(fontSize: number): ReviewDiffVirtualizerMetrics {
  return {
    diffHeaderHeight: 0,
    hunkLineCount: 32,
    hunkSeparatorHeight: 32,
    lineHeight: (fontSize * BASE_LINE_HEIGHT) / 10,
    spacing: 0,
  };
}

const defaultMetrics = createDefaultMetrics(BASE_FONT_SIZE);

function parsePixelValue(value: string, fallback: number): number {
  const normalized = value.trim();
  if (normalized === "0") return 0;
  if (!normalized.endsWith("px")) return fallback;
  const parsed = Number.parseFloat(normalized.slice(0, -2));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readMetrics(element: Element): ReviewDiffVirtualizerMetrics {
  const style = window.getComputedStyle(element);
  return {
    ...defaultMetrics,
    lineHeight: parsePixelValue(style.lineHeight, defaultMetrics.lineHeight),
    spacing: parsePixelValue(
      style.getPropertyValue("--diffs-gap-block"),
      defaultMetrics.spacing,
    ),
  };
}

function metricsEqual(
  left: ReviewDiffVirtualizerMetrics,
  right: ReviewDiffVirtualizerMetrics,
): boolean {
  return (
    left.hunkLineCount === right.hunkLineCount &&
    left.lineHeight === right.lineHeight &&
    left.diffHeaderHeight === right.diffHeaderHeight &&
    left.hunkSeparatorHeight === right.hunkSeparatorHeight &&
    left.spacing === right.spacing &&
    left.paddingTop === right.paddingTop &&
    left.paddingBottom === right.paddingBottom
  );
}

function initializeReviewDiffVirtualizerMetrics(): void {}

export {
  initializeReviewDiffVirtualizerMetrics as i,
  readMetrics as n,
  createDefaultMetrics as r,
  metricsEqual as t,
};
