// Likelihood function specification. Release chunk: type-708888491b1d.js.
import "@rchunk/rolldown-runtime";

interface IntegerParameter {
  kind: "integer";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "LIKELIHOOD_FUNCTION";
  version: 1;
  thumbnailAssetKey: "likelihood-function-v1";
  canonicalFormula: "L(p\\mid k,n) \\propto p^k(1-p)^{n-k}";
  parameters: { successes: IntegerParameter; trials: IntegerParameter };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "LIKELIHOOD_FUNCTION",
    version: 1,
    thumbnailAssetKey: "likelihood-function-v1",
    canonicalFormula: "L(p\\mid k,n) \\propto p^k(1-p)^{n-k}",
    parameters: {
      successes: { kind: "integer", defaultValue: 3, min: 0, max: 48 },
      trials: { kind: "integer", defaultValue: 12, min: 12, max: 48 },
    },
  };
}
export { specification as n, initializeSpecification as t };
