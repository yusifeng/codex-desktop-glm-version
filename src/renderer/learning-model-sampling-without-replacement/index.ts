// Sampling-without-replacement category counts. Release chunk: type-9a0c50e93ce3.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "SAMPLING_WITHOUT_REPLACEMENT";
  version: 3;
  thumbnailAssetKey: "sampling-without-replacement-v1";
  parameters: {
    category_a_count: { kind: "integer"; defaultValue: 4; min: 1; max: 10 };
    category_b_count: { kind: "integer"; defaultValue: 3; min: 1; max: 10 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "SAMPLING_WITHOUT_REPLACEMENT",
    version: 3,
    thumbnailAssetKey: "sampling-without-replacement-v1",
    parameters: {
      category_a_count: { kind: "integer", defaultValue: 4, min: 1, max: 10 },
      category_b_count: { kind: "integer", defaultValue: 3, min: 1, max: 10 },
    },
  };
}
export { specification as n, initialize as t };
