// Boolean logic inputs and operator metadata. Release chunk: type-502dfab37449.js.
import "@rchunk/rolldown-runtime";
type BooleanOperator = "and" | "or";
interface Specification {
  type: "BOOLEAN_LOGIC";
  version: 1;
  thumbnailAssetKey: "boolean-logic-v1";
  parameters: {
    inputA: { kind: "boolean"; defaultValue: true };
    inputB: { kind: "boolean"; defaultValue: false };
    operator: {
      kind: "enum";
      defaultValue: BooleanOperator;
      allowedValues: BooleanOperator[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "BOOLEAN_LOGIC",
    version: 1,
    thumbnailAssetKey: "boolean-logic-v1",
    parameters: {
      inputA: { kind: "boolean", defaultValue: true },
      inputB: { kind: "boolean", defaultValue: false },
      operator: {
        kind: "enum",
        defaultValue: "and",
        allowedValues: ["and", "or"],
      },
    },
  };
}
export { specification as n, initialize as t };
