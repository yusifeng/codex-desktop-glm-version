// Histogram bins for symmetric, skewed, bimodal, and gapped distributions.
import "@rchunk/rolldown-runtime";

type HistogramShape = "roughly symmetric" | "skewed right" | "bimodal" | "gap or outlier";
interface HistogramValues { distribution_shape?: unknown; binWidth?: unknown; inspectedValue?: unknown }
interface HistogramBin { start: number; end: number; count: number }

const histogramSpecification = { type: "HISTOGRAM", version: 2, thumbnailAssetKey: "histogram-v1", parameters: { distribution_shape: { kind: "enum" as const, defaultValue: "roughly symmetric" as HistogramShape, allowedValues: ["roughly symmetric", "skewed right", "bimodal", "gap or outlier"] as HistogramShape[] } } };
const histogramShapes = histogramSpecification.parameters.distribution_shape.allowedValues;
const histogramBinWidths = [5, 10, 20];
const defaultBinWidth = 10;
const histogramBounds = { min: 0, max: 100 };
const observationsByShape: Record<HistogramShape, number[]> = {
  "roughly symmetric": [18, 22, 25, 28, 31, 33, 35, 37, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 61, 62, 63, 65, 67, 69, 72, 75, 78, 82],
  "skewed right": [6, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 35, 37, 39, 41, 44, 47, 51, 55, 60, 66, 72, 79, 87, 96],
  bimodal: [12, 15, 18, 20, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 36, 38, 40, 42, 45, 55, 58, 60, 62, 64, 66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 78, 80, 82, 85, 88],
  "gap or outlier": [8, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 46, 48, 52, 94],
};
const defaultHistogramShape = histogramShapes.find((shape) => shape === histogramSpecification.parameters.distribution_shape.defaultValue) ?? histogramShapes[0];
const defaultHistogramValues = { distribution_shape: defaultHistogramShape, binWidth: defaultBinWidth, inspectedValue: 50 };
const longestSeparatingGap = (bins: HistogramBin[]): number => { const firstNonempty = bins.findIndex(({ count }) => count > 0); let lastNonempty = bins.length - 1; while (lastNonempty >= 0 && bins[lastNonempty].count === 0) lastNonempty -= 1; let run = 0; let longest = 0; for (let index = firstNonempty + 1; index < lastNonempty; index += 1) { if (bins[index].count === 0) { run += 1; longest = Math.max(longest, run); } else run = 0; } return longest; };
const buildHistogramBins = (observations: number[], binWidth: number): HistogramBin[] => { const binCount = (histogramBounds.max - histogramBounds.min) / binWidth; const bins = Array.from({ length: binCount }, (_, index) => ({ start: histogramBounds.min + index * binWidth, end: histogramBounds.min + (index + 1) * binWidth, count: 0 })); for (const observation of observations) { const index = Math.min(binCount - 1, Math.floor((observation - histogramBounds.min) / binWidth)); bins[index].count += 1; } return bins; };
const calculateHistogram = (values: HistogramValues) => {
  const shape = typeof values.distribution_shape === "string" && histogramShapes.some((candidate) => candidate === values.distribution_shape) ? values.distribution_shape as HistogramShape : defaultHistogramShape;
  const requestedBinWidth = Number(values.binWidth);
  const binWidth = Number.isFinite(requestedBinWidth) ? histogramBinWidths.reduce((closest, candidate) => Math.abs(candidate - requestedBinWidth) < Math.abs(closest - requestedBinWidth) ? candidate : closest) : defaultBinWidth;
  const observations = observationsByShape[shape];
  const bins = buildHistogramBins(observations, binWidth);
  const requestedInspectedValue = Number(values.inspectedValue);
  const inspectedValue = Number.isFinite(requestedInspectedValue) ? Math.min(histogramBounds.max, Math.max(histogramBounds.min, requestedInspectedValue)) : defaultHistogramValues.inspectedValue;
  const inspectedBinIndex = Math.min(bins.length - 1, Math.floor((inspectedValue - histogramBounds.min) / binWidth));
  return { shape, binWidth, observations, bins, totalCount: observations.length, maximumCount: Math.max(...bins.map(({ count }) => count)), separatingGapBinCount: longestSeparatingGap(bins), inspectedValue, inspectedBin: bins[inspectedBinIndex] };
};

function initializeHistogramSpecification(): void {}
function initializeHistogramModel(): void {}

export { calculateHistogram as a, histogramSpecification as c, histogramBounds as i, defaultHistogramValues as n, initializeHistogramModel as o, histogramShapes as r, initializeHistogramSpecification as s, histogramBinWidths as t };
