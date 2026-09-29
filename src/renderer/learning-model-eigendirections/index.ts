// Eigendirections specification. Release chunk: type-bbf18f237f67.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "EIGENDIRECTIONS";
  version: 1;
  thumbnailAssetKey: "eigendirections-v1";
  canonicalFormula: "A\\mathbf{v}=\\lambda\\mathbf{v}";
  parameters: {
    a11: NumberParameter;
    a12: NumberParameter;
    a21: NumberParameter;
    a22: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "EIGENDIRECTIONS",
    version: 1,
    thumbnailAssetKey: "eigendirections-v1",
    canonicalFormula: "A\\mathbf{v}=\\lambda\\mathbf{v}",
    parameters: {
      a11: { kind: "number", defaultValue: 2, min: -2, max: 2 },
      a12: { kind: "number", defaultValue: 1, min: -2, max: 2 },
      a21: { kind: "number", defaultValue: 1, min: -2, max: 2 },
      a22: { kind: "number", defaultValue: 2, min: -2, max: 2 },
    },
  };
}
export { specification as n, initializeSpecification as t };
