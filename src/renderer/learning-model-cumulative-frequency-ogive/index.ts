// Cumulative-frequency ogive with threshold and percentile interpolation.
import "@rchunk/rolldown-runtime";

interface OgiveValues { threshold?: number | null; percentile?: number | null }

const classBoundaries = [349.5, 664.5, 979.5, 1294.5, 1609.5, 1924.5, 2239.5, 2554.5];
const classFrequencies = [4, 8, 5, 6, 0, 0, 1];
const cumulativeCounts = [0, 4, 12, 17, 23, 23, 23, 24];
const thresholdControl = { min: classBoundaries[0], max: classBoundaries[classBoundaries.length - 1], step: 0.5, defaultValue: 1500 };
const percentileControl = { min: 0, max: 100, step: 1, defaultValue: 50 };
const clampOrDefault = (value: number | null | undefined, minimum: number, maximum: number, defaultValue: number): number =>
  Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value ?? defaultValue)) : defaultValue;
const normalizeOgiveValues = (values: OgiveValues) => ({
  threshold: clampOrDefault(values.threshold, thresholdControl.min, thresholdControl.max, thresholdControl.defaultValue),
  percentile: clampOrDefault(values.percentile, percentileControl.min, percentileControl.max, percentileControl.defaultValue),
});
const classIndexForThreshold = (threshold: number): number =>
  Math.min(classFrequencies.length - 1, Math.max(0, classBoundaries.findIndex((boundary) => threshold <= boundary) - 1));
const cumulativeCountAtThreshold = (threshold: number): number => {
  const safeThreshold = clampOrDefault(threshold, thresholdControl.min, thresholdControl.max, thresholdControl.defaultValue);
  if (safeThreshold <= classBoundaries[0]) return 0;
  if (safeThreshold >= classBoundaries[classBoundaries.length - 1]) return 24;
  const classIndex = classIndexForThreshold(safeThreshold);
  const lowerBoundary = classBoundaries[classIndex];
  const upperBoundary = classBoundaries[classIndex + 1];
  const position = (safeThreshold - lowerBoundary) / (upperBoundary - lowerBoundary);
  return cumulativeCounts[classIndex] + classFrequencies[classIndex] * position;
};
const valueAtPercentile = (percentile: number): number => {
  const count = 24 * clampOrDefault(percentile, percentileControl.min, percentileControl.max, percentileControl.defaultValue) / 100;
  if (count <= 0) return classBoundaries[0];
  if (count >= 24) return classBoundaries[classBoundaries.length - 1];
  const upperIndex = cumulativeCounts.findIndex((cumulativeCount) => cumulativeCount >= count);
  const lowerIndex = upperIndex - 1;
  const lowerCount = cumulativeCounts[lowerIndex];
  const upperCount = cumulativeCounts[upperIndex];
  const lowerBoundary = classBoundaries[lowerIndex];
  const upperBoundary = classBoundaries[upperIndex];
  return lowerBoundary + (count - lowerCount) / (upperCount - lowerCount) * (upperBoundary - lowerBoundary);
};
const calculateOgive = (values: OgiveValues) => {
  const normalized = normalizeOgiveValues(values);
  const classIndex = classIndexForThreshold(normalized.threshold);
  const thresholdCount = cumulativeCountAtThreshold(normalized.threshold);
  return { ...normalized, thresholdCount, thresholdPercent: thresholdCount / 24 * 100, percentileCount: 24 * normalized.percentile / 100, percentileValue: valueAtPercentile(normalized.percentile), classFrequency: classFrequencies[classIndex], classLower: classBoundaries[classIndex], classUpper: classBoundaries[classIndex + 1] };
};

function initializeCumulativeFrequencyOgiveModel(): void {}

export { calculateOgive as a, thresholdControl as i, cumulativeCounts as n, initializeCumulativeFrequencyOgiveModel as o, percentileControl as r, normalizeOgiveValues as s, classBoundaries as t };
