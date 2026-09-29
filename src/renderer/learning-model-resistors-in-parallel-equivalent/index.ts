// Parallel resistor equivalent specification. Release chunk: type-fa418230ee38.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "RESISTORS_IN_PARALLEL_EQUIVALENT";
  version: 1;
  thumbnailAssetKey: "resistors-in-parallel-equivalent-v1";
  canonicalFormula: "\\frac{1}{R_T} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}";
  canonicalFormulaAliases: [
    "\\frac{1}{R_T} = \\frac{1}{R_1} + \\frac{1}{R_2}",
    "\\frac{1}{R_{\\text{eq}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}",
  ];
  parameters: {
    r1: NumberParameter;
    r2: NumberParameter;
    r3: NumberParameter;
    voltage: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "RESISTORS_IN_PARALLEL_EQUIVALENT",
    version: 1,
    thumbnailAssetKey: "resistors-in-parallel-equivalent-v1",
    canonicalFormula:
      "\\frac{1}{R_T} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}",
    canonicalFormulaAliases: [
      "\\frac{1}{R_T} = \\frac{1}{R_1} + \\frac{1}{R_2}",
      "\\frac{1}{R_{\\text{eq}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}",
    ],
    parameters: {
      r1: { kind: "number", defaultValue: 8, min: 0.1, max: 100_000 },
      r2: { kind: "number", defaultValue: 8, min: 0.1, max: 100_000 },
      r3: { kind: "number", defaultValue: 8, min: 0.1, max: 100_000 },
      voltage: { kind: "number", defaultValue: 12, min: 0, max: 1_000 },
    },
  };
}
export { specification as n, initializeSpecification as t };
