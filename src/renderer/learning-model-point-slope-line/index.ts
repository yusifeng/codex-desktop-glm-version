// Point-slope line specification. Release chunk: type-9302b5a4f072.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "POINT_SLOPE_LINE";
  version: 1;
  thumbnailAssetKey: "point-slope-line-v1";
  canonicalFormula: "y - y_1 = m(x - x_1)";
  parameters: {
    x1: NumberParameter;
    y1: NumberParameter;
    slope: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "POINT_SLOPE_LINE",
    version: 1,
    thumbnailAssetKey: "point-slope-line-v1",
    canonicalFormula: "y - y_1 = m(x - x_1)",
    parameters: {
      x1: { kind: "number", defaultValue: -3, min: -100, max: 100 },
      y1: { kind: "number", defaultValue: -2, min: -100, max: 100 },
      slope: { kind: "number", defaultValue: 0.75, min: -20, max: 20 },
    },
  };
}
export { specification as n, initializeSpecification as t };
