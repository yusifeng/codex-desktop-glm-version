// Beer-Lambert law learning-model manifest. Release chunk: type-b8a457382aa2.js.
import "@rchunk/rolldown-runtime";

const beerLambertLawSpecification = {
  type: "BEER_LAMBERT_LAW",
  version: 2,
  thumbnailAssetKey: "beer-lambert-law-v2",
  canonicalFormula: "A = \\varepsilon c l",
  canonicalFormulaAliases: [
    "A=\\varepsilon l c",
    "A = \\epsilon c l",
    "c = \\frac{A}{\\varepsilon l}",
    "l = \\frac{A}{\\varepsilon c}",
    "\\varepsilon = \\frac{A}{c l}",
  ],
  parameters: {
    molarAbsorptivity: { kind: "number" as const, defaultValue: 1.2, min: 0.01, max: 100_000 },
    concentration: { kind: "number" as const, defaultValue: 0.8, min: 0.01, max: 10 },
    pathLength: { kind: "number" as const, defaultValue: 1, min: 0.01, max: 100 },
  },
};

function initializeBeerLambertLawSpecification(): void {}

export { beerLambertLawSpecification as n, initializeBeerLambertLawSpecification as t };
