// Linear combination specification. Release chunk: type-44949bae7160.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "LINEAR_COMBINATION";
  version: 1;
  thumbnailAssetKey: "linear-combination-v1";
  canonicalFormula: "\\vec{w}=a\\vec{u}+b\\vec{v}";
  parameters: {
    coefficientA: NumberParameter;
    coefficientB: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "LINEAR_COMBINATION",
    version: 1,
    thumbnailAssetKey: "linear-combination-v1",
    canonicalFormula: "\\vec{w}=a\\vec{u}+b\\vec{v}",
    parameters: {
      coefficientA: { kind: "number", defaultValue: 1, min: -2, max: 2 },
      coefficientB: { kind: "number", defaultValue: 1, min: -2, max: 2 },
    },
  };
}
export { specification as n, initializeSpecification as t };
