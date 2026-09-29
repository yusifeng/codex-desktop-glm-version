// Classification-threshold learning-model manifest. Release chunk: type-358a8002801a.js.
import "@rchunk/rolldown-runtime";

const classificationThresholdSpecification = {
  type: "CLASSIFICATION_THRESHOLD",
  version: 3,
  thumbnailAssetKey: "classification-threshold-v1",
  parameters: {
    threshold: { kind: "number" as const, defaultValue: 0.5, min: 0, max: 1 },
  },
};

function initializeClassificationThresholdSpecification(): void {}

export { classificationThresholdSpecification as n, initializeClassificationThresholdSpecification as t };
