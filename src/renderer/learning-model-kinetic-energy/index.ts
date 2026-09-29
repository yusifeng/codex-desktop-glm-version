// Kinetic energy specification. Release chunk: type-5b4bf103a88b.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "KINETIC_ENERGY";
  version: 1;
  thumbnailAssetKey: "kinetic-energy-v1";
  canonicalFormula: "\\mathrm{KE} = \\frac{1}{2}mv^2";
  canonicalFormulaAliases: [
    "KE = \\frac{1}{2}mv^2",
    "K = \\frac{1}{2}mv^2",
    "KE = mv^2/2",
    "K = mv^2/2",
    "\\frac{1}{2}mv^2 = KE",
    "mv^2/2 = KE",
  ];
  parameters: {
    mass: { kind: "number"; defaultValue: 5; min: 1; max: 9 };
    velocity: { kind: "number"; defaultValue: 0; min: -10; max: 10 };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "KINETIC_ENERGY",
    version: 1,
    thumbnailAssetKey: "kinetic-energy-v1",
    canonicalFormula: "\\mathrm{KE} = \\frac{1}{2}mv^2",
    canonicalFormulaAliases: [
      "KE = \\frac{1}{2}mv^2",
      "K = \\frac{1}{2}mv^2",
      "KE = mv^2/2",
      "K = mv^2/2",
      "\\frac{1}{2}mv^2 = KE",
      "mv^2/2 = KE",
    ],
    parameters: {
      mass: { kind: "number", defaultValue: 5, min: 1, max: 9 },
      velocity: { kind: "number", defaultValue: 0, min: -10, max: 10 },
    },
  };
}
export { specification as n, initializeSpecification as t };
