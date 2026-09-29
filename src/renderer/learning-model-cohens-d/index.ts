// Cohen's d learning-model manifest. Release chunk: type-bd561e5dd245.js.
import "@rchunk/rolldown-runtime";

const cohensDSpecification = {
  type: "COHENS_D",
  version: 1,
  thumbnailAssetKey: "cohens-d-v1",
  canonicalFormula: "d = \\frac{\\bar{x}_2 - \\bar{x}_1}{s_{\\mathrm{pooled}}}",
  parameters: {
    initial_mean_difference: { kind: "number" as const, defaultValue: 0.8, min: -4, max: 4 },
    pooled_standard_deviation: { kind: "number" as const, defaultValue: 1, min: 0.75, max: 2 },
  },
};

function initializeCohensDSpecification(): void {}

export { cohensDSpecification as n, initializeCohensDSpecification as t };
