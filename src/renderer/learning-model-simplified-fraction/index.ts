// Simplified-fraction learning-model manifest. Release chunk: type-b2d049022561.js.
import "@rchunk/rolldown-runtime";

const simplifiedFractionSpecification = {
  type: "SIMPLIFIED_FRACTION",
  version: 2,
  thumbnailAssetKey: "simplified-fraction-v1",
  parameters: {
    numerator: { kind: "integer" as const, defaultValue: 6, min: 1, max: 12 },
    denominator: { kind: "integer" as const, defaultValue: 8, min: 4, max: 24 },
  },
};

function initializeSimplifiedFractionSpecification(): void {}

export { simplifiedFractionSpecification as n, initializeSimplifiedFractionSpecification as t };
