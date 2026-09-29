// Reaction-order plot selector. Release chunk: type-9eaaebe29f2e.js.
import "@rchunk/rolldown-runtime";
type ReactionOrder = "zero-order" | "first-order" | "second-order";
interface Specification {
  type: "REACTION_ORDER_PLOTS";
  version: 2;
  thumbnailAssetKey: "reaction-order-plots-v1";
  parameters: {
    reaction_order: {
      kind: "enum";
      defaultValue: ReactionOrder;
      allowedValues: ReactionOrder[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "REACTION_ORDER_PLOTS",
    version: 2,
    thumbnailAssetKey: "reaction-order-plots-v1",
    parameters: {
      reaction_order: {
        kind: "enum",
        defaultValue: "first-order",
        allowedValues: ["zero-order", "first-order", "second-order"],
      },
    },
  };
}
export { specification as n, initialize as t };
