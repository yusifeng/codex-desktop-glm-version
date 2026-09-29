// Half/full adder logic learning-model specification. Release chunk: type-6637f6f4ce37.js.
import "@rchunk/rolldown-runtime";

interface BooleanParameter {
  kind: "boolean";
  defaultValue: boolean;
}
interface Specification {
  type: "HALF_FULL_ADDER_LOGIC";
  version: 2;
  thumbnailAssetKey: "half-full-adder-logic-v1";
  parameters: {
    a: BooleanParameter;
    b: BooleanParameter;
    carryIn: BooleanParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "HALF_FULL_ADDER_LOGIC",
    version: 2,
    thumbnailAssetKey: "half-full-adder-logic-v1",
    parameters: {
      a: { kind: "boolean", defaultValue: true },
      b: { kind: "boolean", defaultValue: false },
      carryIn: { kind: "boolean", defaultValue: true },
    },
  };
}
export { specification as n, initializeSpecification as t };
