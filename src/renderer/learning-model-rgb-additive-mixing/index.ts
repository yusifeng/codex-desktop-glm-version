// RGB additive mixing specification. Release chunk: type-94130cd0d6af.js.
import "@rchunk/rolldown-runtime";

interface IntegerParameter {
  kind: "integer";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "RGB_ADDITIVE_MIXING";
  version: 1;
  thumbnailAssetKey: "rgb-additive-mixing-v1";
  parameters: {
    red: IntegerParameter;
    green: IntegerParameter;
    blue: IntegerParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "RGB_ADDITIVE_MIXING",
    version: 1,
    thumbnailAssetKey: "rgb-additive-mixing-v1",
    parameters: {
      red: { kind: "integer", defaultValue: 255, min: 0, max: 255 },
      green: { kind: "integer", defaultValue: 255, min: 0, max: 255 },
      blue: { kind: "integer", defaultValue: 255, min: 0, max: 255 },
    },
  };
}
export { specification as n, initializeSpecification as t };
