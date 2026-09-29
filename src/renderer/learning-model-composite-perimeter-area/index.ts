// Composite perimeter and area specification. Release chunk: type-94076f401ee2.js.
import "@rchunk/rolldown-runtime";

interface IntegerParameter {
  kind: "integer";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "COMPOSITE_PERIMETER_AREA";
  version: 1;
  thumbnailAssetKey: "composite-perimeter-area-v2";
  parameters: {
    lowerWidth: IntegerParameter;
    lowerHeight: IntegerParameter;
    upperWidth: IntegerParameter;
    upperHeight: IntegerParameter;
    triangleRun: IntegerParameter;
    mode: {
      kind: "enum";
      defaultValue: "area";
      allowedValues: ["area", "perimeter"];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "COMPOSITE_PERIMETER_AREA",
    version: 1,
    thumbnailAssetKey: "composite-perimeter-area-v2",
    parameters: {
      lowerWidth: { kind: "integer", defaultValue: 6, min: 4, max: 7 },
      lowerHeight: { kind: "integer", defaultValue: 3, min: 2, max: 4 },
      upperWidth: { kind: "integer", defaultValue: 3, min: 2, max: 3 },
      upperHeight: { kind: "integer", defaultValue: 2, min: 1, max: 3 },
      triangleRun: { kind: "integer", defaultValue: 4, min: 1, max: 4 },
      mode: {
        kind: "enum",
        defaultValue: "area",
        allowedValues: ["area", "perimeter"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
