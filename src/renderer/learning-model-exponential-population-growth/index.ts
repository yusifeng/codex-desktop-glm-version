// Exponential-population-growth manifest. Release chunk: type-d30facd9fda1.js.
import "@rchunk/rolldown-runtime";

const exponentialPopulationGrowthSpecification = {
  type: "EXPONENTIAL_POPULATION_GROWTH",
  version: 1,
  thumbnailAssetKey: "exponential-population-growth-v1",
  canonicalFormula: "N(t)=N_0(1+r)^t",
  parameters: {
    initial_population: { kind: "integer" as const, defaultValue: 200, min: 20, max: 2_000 },
    growth_rate_percent: { kind: "number" as const, defaultValue: 10, min: 4, max: 15 },
    elapsed_periods: { kind: "number" as const, defaultValue: 10, min: 0, max: 20 },
  },
};

function initializeExponentialPopulationGrowthSpecification(): void {}

export { exponentialPopulationGrowthSpecification as n, initializeExponentialPopulationGrowthSpecification as t };
