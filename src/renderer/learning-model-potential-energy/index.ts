// Potential energy specification. Release chunk: type-36e7bc0980f2.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "POTENTIAL_ENERGY";
  version: 2;
  thumbnailAssetKey: "potential-energy-v1";
  canonicalFormula: "PE = mgh";
  canonicalFormulaAliases: string[];
  parameters: {
    mass: { kind: "number"; defaultValue: 3.4; min: 0.01; max: 10_000 };
    height: { kind: "number"; defaultValue: 9; min: 0; max: 10_000 };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "POTENTIAL_ENERGY",
    version: 2,
    thumbnailAssetKey: "potential-energy-v1",
    canonicalFormula: "PE = mgh",
    canonicalFormulaAliases: [
      "EP = mgh",
      "E_p = mgh",
      "U = mgh",
      "\\Delta U = mgh",
      "\\Delta PE = mgh",
      "mgh = PE",
      "U = m \\cdot g \\cdot h",
      "U = m \\times g \\times h",
      "E_p = m \\cdot g \\cdot h",
      "E_p = m \\times g \\times h",
      "m = \\frac{U}{gh}",
      "g = \\frac{U}{mh}",
      "h = \\frac{U}{mg}",
      "m = \\frac{E_p}{gh}",
      "g = \\frac{E_p}{mh}",
      "h = \\frac{E_p}{mg}",
    ],
    parameters: {
      mass: { kind: "number", defaultValue: 3.4, min: 0.01, max: 10_000 },
      height: { kind: "number", defaultValue: 9, min: 0, max: 10_000 },
    },
  };
}
export { specification as n, initializeSpecification as t };
