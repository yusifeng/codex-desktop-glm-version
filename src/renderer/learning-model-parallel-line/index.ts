// Parallel line specification. Release chunk: type-bc00b8c55dd6.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "PARALLEL_LINE";
  version: 1;
  thumbnailAssetKey: "parallel-line-v1";
  parameters: {
    slope: NumberParameter;
    referenceIntercept: NumberParameter;
    comparisonIntercept: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "PARALLEL_LINE",
    version: 1,
    thumbnailAssetKey: "parallel-line-v1",
    parameters: {
      slope: { kind: "number", defaultValue: 0.6, min: -1, max: 1 },
      referenceIntercept: { kind: "number", defaultValue: 0, min: -4, max: 4 },
      comparisonIntercept: { kind: "number", defaultValue: 3, min: -4, max: 4 },
    },
  };
}
export { specification as n, initializeSpecification as t };
