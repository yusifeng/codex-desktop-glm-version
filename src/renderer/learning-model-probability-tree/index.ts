// Probability tree specification. Release chunk: type-bb80ea70b787.js.
import "@rchunk/rolldown-runtime";

interface IntegerParameter {
  kind: "integer";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "PROBABILITY_TREE";
  version: 2;
  thumbnailAssetKey: "probability-tree-v1";
  parameters: {
    first_outcome_count: IntegerParameter;
    second_outcome_count: IntegerParameter;
    with_replacement: { kind: "boolean"; defaultValue: false };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "PROBABILITY_TREE",
    version: 2,
    thumbnailAssetKey: "probability-tree-v1",
    parameters: {
      first_outcome_count: {
        kind: "integer",
        defaultValue: 3,
        min: 1,
        max: 12,
      },
      second_outcome_count: {
        kind: "integer",
        defaultValue: 8,
        min: 1,
        max: 12,
      },
      with_replacement: { kind: "boolean", defaultValue: false },
    },
  };
}
export { specification as n, initializeSpecification as t };
