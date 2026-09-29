// Galvanic-cell pair selector metadata. Release chunk: type-448ce06dc011.js.
import "@rchunk/rolldown-runtime";

type CellPair = "zinc-copper" | "copper-silver";
interface GalvanicCellSpecification {
  type: "GALVANIC_CELL";
  version: 2;
  thumbnailAssetKey: "galvanic-cell-v2";
  parameters: {
    cell_pair: {
      kind: "enum";
      defaultValue: CellPair;
      allowedValues: CellPair[];
    };
  };
}

let galvanicCellSpecification: GalvanicCellSpecification;
let initialized = false;
function initializeGalvanicCellSpecification(): void {
  if (initialized) return;
  initialized = true;
  galvanicCellSpecification = {
    type: "GALVANIC_CELL",
    version: 2,
    thumbnailAssetKey: "galvanic-cell-v2",
    parameters: {
      cell_pair: {
        kind: "enum",
        defaultValue: "zinc-copper",
        allowedValues: ["zinc-copper", "copper-silver"],
      },
    },
  };
}

export {
  galvanicCellSpecification as n,
  initializeGalvanicCellSpecification as t,
};
