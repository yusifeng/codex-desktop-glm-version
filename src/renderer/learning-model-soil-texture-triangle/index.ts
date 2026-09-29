// Soil texture triangle learning-model specification. Release chunk: type-4ea25b9db993.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "SOIL_TEXTURE_TRIANGLE";
  version: 1;
  thumbnailAssetKey: "soil-texture-triangle-v1";
  parameters: { sand_percent: NumberParameter; clay_percent: NumberParameter };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "SOIL_TEXTURE_TRIANGLE",
    version: 1,
    thumbnailAssetKey: "soil-texture-triangle-v1",
    parameters: {
      sand_percent: { kind: "number", defaultValue: 40, min: 0, max: 100 },
      clay_percent: { kind: "number", defaultValue: 20, min: 0, max: 100 },
    },
  };
}
export { specification as n, initializeSpecification as t };
