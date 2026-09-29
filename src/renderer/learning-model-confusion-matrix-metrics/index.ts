// Confusion-matrix counts and derived binary-classification metrics.
import "@rchunk/rolldown-runtime";
import { n as initializeBinaryMetrics, t as computeBinaryMetric } from "@rchunk/binary-classification-metrics";

type MetricName = "accuracy" | "precision" | "recall" | "specificity" | "f1";
interface ConfusionValues { truePositiveCount?: number | null; falsePositiveCount?: number | null; trueNegativeCount?: number | null; falseNegativeCount?: number | null; metric?: unknown }
const confusionType = "CONFUSION_MATRIX_METRICS"; const confusionThumbnail = "confusion-matrix-metrics-v1";
const confusionParameters = { truePositiveCount: { kind: "integer", defaultValue: 32, min: 0, max: 100 }, falsePositiveCount: { kind: "integer", defaultValue: 8, min: 0, max: 100 }, trueNegativeCount: { kind: "integer", defaultValue: 48, min: 0, max: 100 }, falseNegativeCount: { kind: "integer", defaultValue: 12, min: 0, max: 100 } };
const confusionDefinition = { type: confusionType, version: 1, thumbnailAssetKey: confusionThumbnail, parameters: confusionParameters }; const metricNames: MetricName[] = ["accuracy", "precision", "recall", "specificity", "f1"]; const defaultMetric: MetricName = "accuracy";
const normalizeCount = (value: number | null | undefined, parameter: { defaultValue: number; min: number; max: number }): number => Number.isFinite(value) ? Math.min(parameter.max, Math.max(parameter.min, Math.round(value as number))) : parameter.defaultValue;
const isMetricName = (value: unknown): value is MetricName => value != null && metricNames.includes(value as MetricName);
const normalizeConfusionValues = (values: ConfusionValues) => ({ truePositiveCount: normalizeCount(values.truePositiveCount, confusionParameters.truePositiveCount), falsePositiveCount: normalizeCount(values.falsePositiveCount, confusionParameters.falsePositiveCount), trueNegativeCount: normalizeCount(values.trueNegativeCount, confusionParameters.trueNegativeCount), falseNegativeCount: normalizeCount(values.falseNegativeCount, confusionParameters.falseNegativeCount), metric: isMetricName(values.metric) ? values.metric : defaultMetric });
const deriveConfusionMatrixMetrics = (values: ConfusionValues) => { initializeBinaryMetrics(); const safe = normalizeConfusionValues(values); const counts = { tp: safe.truePositiveCount, fp: safe.falsePositiveCount, tn: safe.trueNegativeCount, fn: safe.falseNegativeCount }; return { ...safe, counts, metricAnalysis: computeBinaryMetric(safe.metric, counts) }; };
function initializeConfusionSchema(): void {}
function initializeConfusionModel(): void {}
export { initializeConfusionSchema as a, initializeConfusionModel as i, defaultMetric as n, confusionDefinition as o, deriveConfusionMatrixMetrics as r, metricNames as t };
