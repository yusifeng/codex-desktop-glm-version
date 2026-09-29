// Derivative product-rule specification. Release chunk: type-37bbc177d1c1.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "DERIVATIVE_PRODUCT_RULE";
  version: 1;
  thumbnailAssetKey: "derivative-product-rule-v1";
  canonicalFormula: "(fg)' = f'g + fg'";
  parameters: {
    deltaX: { kind: "number"; defaultValue: 2; min: 0.05; max: 2 };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "DERIVATIVE_PRODUCT_RULE",
    version: 1,
    thumbnailAssetKey: "derivative-product-rule-v1",
    canonicalFormula: "(fg)' = f'g + fg'",
    parameters: {
      deltaX: { kind: "number", defaultValue: 2, min: 0.05, max: 2 },
    },
  };
}
export { specification as n, initializeSpecification as t };
