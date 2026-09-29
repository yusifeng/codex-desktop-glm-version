// Intermolecular forces learning-model specification. Release chunk: type-9e89df8b418e.js.
import "@rchunk/rolldown-runtime";

interface ExampleParameter {
  kind: "enum";
  defaultValue: "water";
  allowedValues: ["methane", "hydrogen chloride", "water"];
}
interface Specification {
  type: "INTERMOLECULAR_FORCES";
  version: 1;
  thumbnailAssetKey: "intermolecular-forces-v2";
  parameters: { initial_example: ExampleParameter };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "INTERMOLECULAR_FORCES",
    version: 1,
    thumbnailAssetKey: "intermolecular-forces-v2",
    parameters: {
      initial_example: {
        kind: "enum",
        defaultValue: "water",
        allowedValues: ["methane", "hydrogen chloride", "water"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
