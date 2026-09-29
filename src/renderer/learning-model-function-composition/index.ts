// Function-composition operation metadata. Release chunk: type-08ab5fc42dc6.js.
import "@rchunk/rolldown-runtime";
type Operation = "add 2" | "multiply by 3" | "square" | "negate";
type Order = "g_then_f" | "f_then_g";
interface Specification {
  type: "FUNCTION_COMPOSITION";
  version: 1;
  thumbnailAssetKey: "function-composition-v1";
  parameters: {
    input_value: { kind: "number"; defaultValue: 2; min: -10; max: 10 };
    g_operation: {
      kind: "enum";
      defaultValue: Operation;
      allowedValues: Operation[];
    };
    f_operation: {
      kind: "enum";
      defaultValue: Operation;
      allowedValues: Operation[];
    };
    composition_order: {
      kind: "enum";
      defaultValue: Order;
      allowedValues: Order[];
    };
  };
}
let specification: Specification;
let initialized = false;
const operations: Operation[] = ["add 2", "multiply by 3", "square", "negate"];
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "FUNCTION_COMPOSITION",
    version: 1,
    thumbnailAssetKey: "function-composition-v1",
    parameters: {
      input_value: { kind: "number", defaultValue: 2, min: -10, max: 10 },
      g_operation: {
        kind: "enum",
        defaultValue: "add 2",
        allowedValues: [...operations],
      },
      f_operation: {
        kind: "enum",
        defaultValue: "multiply by 3",
        allowedValues: [...operations],
      },
      composition_order: {
        kind: "enum",
        defaultValue: "g_then_f",
        allowedValues: ["g_then_f", "f_then_g"],
      },
    },
  };
}
export { specification as n, initialize as t };
