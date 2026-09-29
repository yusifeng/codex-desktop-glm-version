// Series-resistance learning-model manifest. Release chunk: type-2ba608a4bdee.js.
import "@rchunk/rolldown-runtime";

const resistorsInSeriesEquivalentSpecification = {
  type: "RESISTORS_IN_SERIES_EQUIVALENT",
  version: 1,
  thumbnailAssetKey: "resistors-in-series-equivalent-v1",
  canonicalFormula: "R_{\\text{total}} = R_1 + R_2 + \\dots",
  canonicalFormulaAliases: [
    "R_{\\text{eq}} = R_1 + R_2 + R_3",
    "R_T = R_1 + R_2 + R_3",
    "R_{eq} = R_1 + R_2 + R_3",
  ],
  parameters: {
    r1: { kind: "number" as const, defaultValue: 8, min: 0.1, max: 100_000 },
    r2: { kind: "number" as const, defaultValue: 8, min: 0.1, max: 100_000 },
    r3: { kind: "number" as const, defaultValue: 8, min: 0.1, max: 100_000 },
    voltage: { kind: "number" as const, defaultValue: 12, min: 0, max: 1_000 },
  },
};

function initializeResistorsInSeriesEquivalentSpecification(): void {}

export {
  resistorsInSeriesEquivalentSpecification as n,
  initializeResistorsInSeriesEquivalentSpecification as t,
};
