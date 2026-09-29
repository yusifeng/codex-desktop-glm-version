// Solow steady-state learning-model manifest. Release chunk: type-729304fc6ff2.js.
import "@rchunk/rolldown-runtime";

const solowSteadyStateSpecification = {
  type: "SOLOW_STEADY_STATE",
  version: 1,
  thumbnailAssetKey: "solow-steady-state-v1",
  canonicalFormula: "s f(k^*) = (\\delta + n + g)k^*",
  parameters: {
    savingRatePercent: { kind: "number" as const, defaultValue: 25, min: 10, max: 40 },
    depreciationRatePercent: { kind: "number" as const, defaultValue: 5, min: 3, max: 10 },
    populationGrowthRatePercent: { kind: "number" as const, defaultValue: 1.5, min: 0.5, max: 4 },
    technologyGrowthRatePercent: { kind: "number" as const, defaultValue: 2, min: 0.5, max: 4 },
  },
};

function initializeSolowSteadyStateSpecification(): void {}

export { solowSteadyStateSpecification as n, initializeSolowSteadyStateSpecification as t };
