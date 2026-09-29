// Side-by-side box-plots comparison learning model. Release chunk: model-54778b6d513f.js.
import "@rchunk/rolldown-runtime";

type BoxPlotComparison = "same-median-different-iqr" | "different-median-same-iqr" | "different-median-different-iqr";
interface BoxPlotValues { initial_comparison?: string | null; comparisonMedian?: number | null; comparisonIqr?: number | null }
interface FiveNumberSummary { minimum: number; q1: number; median: number; q3: number; maximum: number }
interface BoxPlotManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { initial_comparison: { kind: "enum"; defaultValue: BoxPlotComparison; allowedValues: BoxPlotComparison[] } };
}

let boxPlotManifest: BoxPlotManifest;
let comparisonMedianControl: { min: number; max: number; step: number };
let comparisonIqrControl: { min: number; max: number; step: number };
let referenceSummary: FiveNumberSummary;
let defaultsForComparison: (comparison: BoxPlotComparison) => { comparisonMedian: number; comparisonIqr: number };
let normalizeComparison: (value: unknown) => BoxPlotComparison;
let normalizeBoxPlotValues: (values: BoxPlotValues) => { initial_comparison: BoxPlotComparison; comparisonMedian: number; comparisonIqr: number };
let calculateComparisonSummary: (values: BoxPlotValues) => FiveNumberSummary;
let interquartileRange: (summary: FiveNumberSummary) => number;
let totalRange: (summary: FiveNumberSummary) => number;
let manifestInitialized = false;
let modelInitialized = false;

function initializeBoxPlotManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  boxPlotManifest = {
    type: "SIDE_BY_SIDE_BOX_PLOTS", version: 1, thumbnailAssetKey: "side-by-side-box-plots-v1",
    parameters: {
      initial_comparison: {
        kind: "enum", defaultValue: "same-median-different-iqr",
        allowedValues: ["same-median-different-iqr", "different-median-same-iqr", "different-median-different-iqr"],
      },
    },
  };
}

function initializeSideBySideBoxPlotsModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeBoxPlotManifest();
  comparisonMedianControl = { min: 35, max: 65, step: 1 };
  comparisonIqrControl = { min: 10, max: 30, step: 1 };
  const whiskerDistance = 30;
  referenceSummary = { minimum: 15, q1: 38, median: 50, q3: 58, maximum: 85 };
  const normalizeFinite = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
  normalizeComparison = value => {
    switch (value) {
      case "same-median-different-iqr":
      case "different-median-same-iqr":
      case "different-median-different-iqr": return value;
      default: return boxPlotManifest.parameters.initial_comparison.defaultValue;
    }
  };
  defaultsForComparison = comparison => {
    switch (comparison) {
      case "same-median-different-iqr": return { comparisonMedian: 50, comparisonIqr: 30 };
      case "different-median-same-iqr": return { comparisonMedian: 62, comparisonIqr: 20 };
      case "different-median-different-iqr": return { comparisonMedian: 62, comparisonIqr: 30 };
    }
  };
  normalizeBoxPlotValues = values => {
    const initialComparison = normalizeComparison(values.initial_comparison);
    const defaults = defaultsForComparison(initialComparison);
    return {
      initial_comparison: initialComparison,
      comparisonMedian: normalizeFinite(values.comparisonMedian, defaults.comparisonMedian, comparisonMedianControl.min, comparisonMedianControl.max),
      comparisonIqr: normalizeFinite(values.comparisonIqr, defaults.comparisonIqr, comparisonIqrControl.min, comparisonIqrControl.max),
    };
  };
  calculateComparisonSummary = values => {
    const { comparisonMedian, comparisonIqr } = normalizeBoxPlotValues(values);
    return {
      minimum: comparisonMedian - whiskerDistance, q1: comparisonMedian - comparisonIqr / 2, median: comparisonMedian,
      q3: comparisonMedian + comparisonIqr / 2, maximum: comparisonMedian + whiskerDistance,
    };
  };
  interquartileRange = summary => summary.q3 - summary.q1;
  totalRange = summary => summary.maximum - summary.minimum;
}

export {
  defaultsForComparison as a, initializeSideBySideBoxPlotsModel as c, initializeBoxPlotManifest as d, boxPlotManifest as f,
  calculateComparisonSummary as i, normalizeComparison as l, comparisonMedianControl as n, interquartileRange as o,
  referenceSummary as r, totalRange as s, comparisonIqrControl as t, normalizeBoxPlotValues as u,
};
