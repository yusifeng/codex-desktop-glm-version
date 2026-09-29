// Weight-force formula metadata. Release chunk: type-568af520e20e.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "WEIGHT_FORCE";
  version: 1;
  thumbnailAssetKey: "weight-force-v1";
  canonicalFormula: string;
  canonicalFormulaAliases: string[];
  parameters: {
    mass: { kind: "number"; defaultValue: 8; min: 0.01; max: 10000 };
    gravity: { kind: "number"; defaultValue: 9.8; min: 0; max: 10000 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "WEIGHT_FORCE",
    version: 1,
    thumbnailAssetKey: "weight-force-v1",
    canonicalFormula: "F_g = mg",
    canonicalFormulaAliases: [
      "F_G = m g",
      "w = mg",
      "F_g = m\\,g",
      "P = m \\cdot g",
      "F_g = m \\cdot g",
      "F_g = m \\times g",
      "m = \\frac{F_g}{g}",
      "g = \\frac{F_g}{m}",
    ],
    parameters: {
      mass: { kind: "number", defaultValue: 8, min: 0.01, max: 10000 },
      gravity: { kind: "number", defaultValue: 9.8, min: 0, max: 10000 },
    },
  };
}
export { specification as n, initialize as t };
