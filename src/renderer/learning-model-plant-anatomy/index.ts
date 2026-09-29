// Plant anatomy specification. Release chunk: type-a2c1e373aef7.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "PLANT_ANATOMY";
  version: 2;
  thumbnailAssetKey: "plant-anatomy-v3";
  parameters: {
    initial_organ: {
      kind: "enum";
      defaultValue: "root";
      allowedValues: ["root", "stem", "leaf"];
    };
    initial_transport_tissue: {
      kind: "enum";
      defaultValue: "xylem";
      allowedValues: ["xylem", "phloem"];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "PLANT_ANATOMY",
    version: 2,
    thumbnailAssetKey: "plant-anatomy-v3",
    parameters: {
      initial_organ: {
        kind: "enum",
        defaultValue: "root",
        allowedValues: ["root", "stem", "leaf"],
      },
      initial_transport_tissue: {
        kind: "enum",
        defaultValue: "xylem",
        allowedValues: ["xylem", "phloem"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
