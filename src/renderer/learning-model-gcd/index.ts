// GCD learning-model specification. Release chunk: type-a2fa2066a9f8.js.
import "@rchunk/rolldown-runtime";
interface IntegerParameter {
  kind: "integer";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "GCD";
  version: 1;
  thumbnailAssetKey: "gcd-v1";
  parameters: {
    first_number: IntegerParameter;
    second_number: IntegerParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "GCD",
    version: 1,
    thumbnailAssetKey: "gcd-v1",
    parameters: {
      first_number: { kind: "integer", defaultValue: 18, min: 2, max: 24 },
      second_number: { kind: "integer", defaultValue: 12, min: 2, max: 24 },
    },
  };
}
export { specification as n, initializeSpecification as t };
