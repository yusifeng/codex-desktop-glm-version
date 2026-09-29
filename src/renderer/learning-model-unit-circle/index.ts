// Unit circle specification. Release chunk: type-d8fc0e5b690c.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "UNIT_CIRCLE";
  version: 2;
  thumbnailAssetKey: "unit-circle-v1";
  canonicalFormula: "x^2 + y^2 = 1";
  canonicalFormulaAliases: [
    "1 = x^2 + y^2",
    "x^2 + y^2 = 1^2",
    "(x-0)^2 + (y+0)^2 = 1",
    "(\\cos\\theta, \\sin\\theta)",
  ];
  parameters: {
    angleDeg: { kind: "number"; defaultValue: 45; min: -36_000; max: 36_000 };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "UNIT_CIRCLE",
    version: 2,
    thumbnailAssetKey: "unit-circle-v1",
    canonicalFormula: "x^2 + y^2 = 1",
    canonicalFormulaAliases: [
      "1 = x^2 + y^2",
      "x^2 + y^2 = 1^2",
      "(x-0)^2 + (y+0)^2 = 1",
      "(\\cos\\theta, \\sin\\theta)",
    ],
    parameters: {
      angleDeg: { kind: "number", defaultValue: 45, min: -36_000, max: 36_000 },
    },
  };
}
export { specification as n, initializeSpecification as t };
