// Randomized experiment learning-model specification. Release chunk: type-b2315d4b532d.js.
import "@rchunk/rolldown-runtime";

interface NumericParameter {
  kind: "number" | "integer";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "RANDOMIZED_EXPERIMENT";
  version: 2;
  thumbnailAssetKey: "randomized-experiment-v1";
  parameters: {
    experimental_units: NumericParameter;
    treatment_effect: NumericParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "RANDOMIZED_EXPERIMENT",
    version: 2,
    thumbnailAssetKey: "randomized-experiment-v1",
    parameters: {
      experimental_units: {
        kind: "integer",
        defaultValue: 16,
        min: 6,
        max: 30,
      },
      treatment_effect: { kind: "number", defaultValue: 8, min: -20, max: 20 },
    },
  };
}
export { specification as n, initializeSpecification as t };
