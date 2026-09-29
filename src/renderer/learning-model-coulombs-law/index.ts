// Coulomb's law specification. Release chunk: type-80e98d19d04d.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "COULOMBS_LAW";
  version: 1;
  thumbnailAssetKey: "coulombs-law-v2";
  canonicalFormula: "F = k\\frac{q_1q_2}{r^2}";
  canonicalFormulaAliases: string[];
  parameters: {
    q1: NumberParameter;
    q2: NumberParameter;
    distance: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "COULOMBS_LAW",
    version: 1,
    thumbnailAssetKey: "coulombs-law-v2",
    canonicalFormula: "F = k\\frac{q_1q_2}{r^2}",
    canonicalFormulaAliases: [
      "F = k \\frac{q_1 q_2}{r^2}",
      "F = k_e \\frac{q_1 q_2}{r^2}",
      "F = \\frac{k q_1 q_2}{r^2}",
      "E = k\\frac{q}{r^2}",
      "F = k q_1 q_2 / r^2",
      "k q_1 q_2 / r^2 = F",
      "r = \\sqrt{\\frac{k q_1 q_2}{F}}",
      "q_1 = \\frac{F r^2}{k q_2}",
      "q_2 = \\frac{F r^2}{k q_1}",
      "k = \\frac{F r^2}{q_1 q_2}",
    ],
    parameters: {
      q1: { kind: "number", defaultValue: 3, min: -10_000, max: 10_000 },
      q2: { kind: "number", defaultValue: -3, min: -10_000, max: 10_000 },
      distance: { kind: "number", defaultValue: 4, min: 0.01, max: 10_000 },
    },
  };
}
export { specification as n, initializeSpecification as t };
