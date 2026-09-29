// Current-to-magnetic-field specification. Release chunk: type-8ea75e03943c.js.
import "@rchunk/rolldown-runtime";
type Direction = "up" | "down";
interface Specification {
  type: "CURRENT_TO_MAGNETIC_FIELD_DIRECTION";
  version: 1;
  thumbnailAssetKey: "current-to-magnetic-field-direction-v3";
  parameters: {
    currentDirection: {
      kind: "enum";
      defaultValue: Direction;
      allowedValues: Direction[];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "CURRENT_TO_MAGNETIC_FIELD_DIRECTION",
    version: 1,
    thumbnailAssetKey: "current-to-magnetic-field-direction-v3",
    parameters: {
      currentDirection: {
        kind: "enum",
        defaultValue: "up",
        allowedValues: ["up", "down"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
