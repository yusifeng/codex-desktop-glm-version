// Evolutionary selection-pattern selector. Release chunk: type-9a4e4be29b1b.js.
import "@rchunk/rolldown-runtime";
type SelectionPattern = "stabilizing" | "directional" | "disruptive";
interface Specification {
  type: "SELECTION_PATTERNS";
  version: 2;
  thumbnailAssetKey: "selection-patterns-v1";
  parameters: {
    initial_selection_pattern: {
      kind: "enum";
      defaultValue: SelectionPattern;
      allowedValues: SelectionPattern[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "SELECTION_PATTERNS",
    version: 2,
    thumbnailAssetKey: "selection-patterns-v1",
    parameters: {
      initial_selection_pattern: {
        kind: "enum",
        defaultValue: "stabilizing",
        allowedValues: ["stabilizing", "directional", "disruptive"],
      },
    },
  };
}
export { specification as n, initialize as t };
