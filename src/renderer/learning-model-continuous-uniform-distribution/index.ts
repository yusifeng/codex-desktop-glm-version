// Continuous-uniform distribution bounds. Release chunk: type-19d8b437a2d9.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "CONTINUOUS_UNIFORM_DISTRIBUTION";
  version: 2;
  thumbnailAssetKey: "continuous-uniform-distribution-v1";
  parameters: {
    lower_bound: { kind: "number"; defaultValue: 0; min: -20; max: 10 };
    upper_bound: { kind: "number"; defaultValue: 15; min: 11; max: 40 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "CONTINUOUS_UNIFORM_DISTRIBUTION",
    version: 2,
    thumbnailAssetKey: "continuous-uniform-distribution-v1",
    parameters: {
      lower_bound: { kind: "number", defaultValue: 0, min: -20, max: 10 },
      upper_bound: { kind: "number", defaultValue: 15, min: 11, max: 40 },
    },
  };
}
export { specification as n, initialize as t };
