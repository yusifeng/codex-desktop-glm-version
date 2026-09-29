// Age structure pyramid learning-model specification. Release chunk: type-895220240c77.js.
import "@rchunk/rolldown-runtime";

interface PatternParameter {
  kind: "enum";
  defaultValue: "expansive";
  allowedValues: ["expansive", "stationary", "constrictive"];
}
interface Specification {
  type: "AGE_STRUCTURE_PYRAMID";
  version: 3;
  thumbnailAssetKey: "age-structure-pyramid-v1";
  parameters: { initial_pattern: PatternParameter };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "AGE_STRUCTURE_PYRAMID",
    version: 3,
    thumbnailAssetKey: "age-structure-pyramid-v1",
    parameters: {
      initial_pattern: {
        kind: "enum",
        defaultValue: "expansive",
        allowedValues: ["expansive", "stationary", "constrictive"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
