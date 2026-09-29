// Crystal-unit-cell teaching model. Release chunk: model-f07b2dfecde5.js.
import "@rchunk/rolldown-runtime";

type CellType = "simple cubic" | "body-centered cubic" | "face-centered cubic";
type Representation = "lattice-point cell" | "space-filling cutaway" | "repeated cells";
interface CrystalCellInput { cell_type?: string; representation?: string }

const crystalCellTypes: CellType[] = ["simple cubic", "body-centered cubic", "face-centered cubic"];
const crystalRepresentations: Representation[] = ["lattice-point cell", "space-filling cutaway", "repeated cells"];
const includesString = <Value extends string>(values: readonly Value[], value: string | undefined): value is Value =>
  typeof value === "string" && values.some((candidate) => candidate === value);
const calculateCrystalUnitCell = (input: CrystalCellInput) => {
  const cellType = includesString(crystalCellTypes, input.cell_type) ? input.cell_type : "simple cubic";
  const representation = includesString(crystalRepresentations, input.representation)
    ? input.representation
    : "lattice-point cell";
  if (cellType === "body-centered cubic") {
    return { cellType, representation, corners: 8, faces: 0, bodies: 1, netAtoms: 2, atomRadiusOverEdge: Math.sqrt(3) / 4 };
  }
  if (cellType === "face-centered cubic") {
    return { cellType, representation, corners: 8, faces: 6, bodies: 0, netAtoms: 4, atomRadiusOverEdge: Math.SQRT2 / 4 };
  }
  return { cellType, representation, corners: 8, faces: 0, bodies: 0, netAtoms: 1, atomRadiusOverEdge: 0.5 };
};
function initializeCrystalUnitCellsModel(): void {}

export { initializeCrystalUnitCellsModel as i, crystalRepresentations as n, calculateCrystalUnitCell as r, crystalCellTypes as t };
