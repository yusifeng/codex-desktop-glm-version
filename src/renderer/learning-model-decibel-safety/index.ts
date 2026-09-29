// Decibel safety learning-model specification. Release chunk: type-fec75962c1bf.js.
import "@rchunk/rolldown-runtime";

interface NumericParameter {
  kind: "number" | "integer";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "DECIBEL_SAFETY";
  version: 3;
  thumbnailAssetKey: "decibel-safety-v1";
  parameters: {
    sound_level_dba: NumericParameter;
    exposure_duration_minutes: NumericParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "DECIBEL_SAFETY",
    version: 3,
    thumbnailAssetKey: "decibel-safety-v1",
    parameters: {
      sound_level_dba: { kind: "number", defaultValue: 85, min: 82, max: 100 },
      exposure_duration_minutes: {
        kind: "integer",
        defaultValue: 480,
        min: 0,
        max: 960,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
