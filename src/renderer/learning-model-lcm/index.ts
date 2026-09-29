// LCM learning-model specification. Release chunk: type-2a7d2e0bc5c2.js.
import "@rchunk/rolldown-runtime";
interface IntegerParameter {
  kind: "integer";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "LCM";
  version: 2;
  thumbnailAssetKey: "lcm-v1";
  parameters: {
    first_number: IntegerParameter;
    second_number: IntegerParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "LCM",
    version: 2,
    thumbnailAssetKey: "lcm-v1",
    parameters: {
      first_number: { kind: "integer", defaultValue: 4, min: 1, max: 12 },
      second_number: { kind: "integer", defaultValue: 6, min: 1, max: 12 },
    },
  };
}
export { specification as n, initializeSpecification as t };
