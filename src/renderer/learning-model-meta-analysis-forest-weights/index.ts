// Meta-analysis forest weights specification. Release chunk: type-72e940cb9aa1.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "META_ANALYSIS_FOREST_WEIGHTS";
  version: 1;
  thumbnailAssetKey: "meta-analysis-forest-weights-v1";
  parameters: Record<
    | "effect1"
    | "effect2"
    | "effect3"
    | "effect4"
    | "effect5"
    | "weight1"
    | "weight2"
    | "weight3"
    | "weight4"
    | "weight5",
    NumberParameter
  >;
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "META_ANALYSIS_FOREST_WEIGHTS",
    version: 1,
    thumbnailAssetKey: "meta-analysis-forest-weights-v1",
    parameters: {
      effect1: { kind: "number", defaultValue: -0.35, min: -0.8, max: 0.8 },
      effect2: { kind: "number", defaultValue: -0.08, min: -0.8, max: 0.8 },
      effect3: { kind: "number", defaultValue: 0.18, min: -0.8, max: 0.8 },
      effect4: { kind: "number", defaultValue: 0.42, min: -0.8, max: 0.8 },
      effect5: { kind: "number", defaultValue: 0.1, min: -0.8, max: 0.8 },
      weight1: { kind: "number", defaultValue: 5, min: 2, max: 24 },
      weight2: { kind: "number", defaultValue: 12, min: 2, max: 24 },
      weight3: { kind: "number", defaultValue: 8, min: 2, max: 24 },
      weight4: { kind: "number", defaultValue: 18, min: 2, max: 24 },
      weight5: { kind: "number", defaultValue: 10, min: 2, max: 24 },
    },
  };
}
export { specification as n, initializeSpecification as t };
