// Metric-distance learning-model manifest. Release chunk: type-aa70f27546d0.js.
import "@rchunk/rolldown-runtime";

type MetricUnit = "mm" | "cm" | "m" | "km";

const metricDistanceSpecification = {
  type: "METRIC_DISTANCE",
  version: 1,
  thumbnailAssetKey: "metric-distance-v1",
  parameters: {
    lengthCm: { kind: "number" as const, defaultValue: 32, min: 10, max: 50 },
    unit: {
      kind: "enum" as const,
      defaultValue: "cm" as MetricUnit,
      allowedValues: ["mm", "cm", "m", "km"] as MetricUnit[],
    },
  },
};

function initializeMetricDistanceSpecification(): void {}

export { metricDistanceSpecification as n, initializeMetricDistanceSpecification as t };
