// Pressure learning-model manifest. Release chunk: type-e695696a56c8.js.
import "@rchunk/rolldown-runtime";

const pressureSpecification = {
  type: "PRESSURE",
  version: 1,
  thumbnailAssetKey: "pressure-v1",
  canonicalFormula: "P = \\frac{F}{A}",
  canonicalFormulaAliases: ["P = F/A", "F = PA", "A = F/P"],
  parameters: {
    forceNewtons: { kind: "number" as const, defaultValue: 100, min: 0, max: 200 },
    areaSquareMeters: { kind: "number" as const, defaultValue: 2, min: 0.25, max: 5 },
  },
};

function initializePressureSpecification(): void {}

export { pressureSpecification as n, initializePressureSpecification as t };
