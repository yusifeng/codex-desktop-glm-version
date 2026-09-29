// Standard-score formula metadata. Release chunk: type-cb89af0c10e5.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "STANDARD_SCORE_Z";
  version: 2;
  thumbnailAssetKey: "standard-score-z-v1";
  canonicalFormula: string;
  canonicalFormulaAliases: string[];
  parameters: Record<
    "x" | "mu" | "sigma",
    { kind: "number"; defaultValue: number; min: number; max: 10000 }
  >;
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "STANDARD_SCORE_Z",
    version: 2,
    thumbnailAssetKey: "standard-score-z-v1",
    canonicalFormula: "z = \\frac{x - \\mu}{\\sigma}",
    canonicalFormulaAliases: [
      "z = \\frac{x - \\bar{x}}{s}",
      "z = \\frac{\\bar{x} - \\mu_0}{\\sigma / \\sqrt{n}}",
      "z = \\frac{\\bar{x} - \\mu0}{\\sigma / \\sqrt{n}}",
    ],
    parameters: {
      x: { kind: "number", defaultValue: 1.2, min: -10000, max: 10000 },
      mu: { kind: "number", defaultValue: 0, min: -10000, max: 10000 },
      sigma: { kind: "number", defaultValue: 1, min: 0.01, max: 10000 },
    },
  };
}
export { specification as n, initialize as t };
