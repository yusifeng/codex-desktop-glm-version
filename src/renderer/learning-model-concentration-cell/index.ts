// Concentration-cell controls. Release chunk: type-facf186bb1fa.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "CONCENTRATION_CELL";
  version: 2;
  thumbnailAssetKey: "concentration-cell-v1";
  canonicalFormula: string;
  parameters: {
    initial_dilute_concentration_molar: {
      kind: "number";
      defaultValue: 0.001;
      min: 0.0001;
      max: 0.001;
    };
    initial_concentrated_concentration_molar: {
      kind: "number";
      defaultValue: 0.1;
      min: 0.001;
      max: 0.1;
    };
    ion_charge: { kind: "integer"; defaultValue: 2; min: 1; max: 3 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "CONCENTRATION_CELL",
    version: 2,
    thumbnailAssetKey: "concentration-cell-v1",
    canonicalFormula:
      "E_{\\mathrm{cell}}=\\frac{0.0592\\,\\mathrm{V}}{z}\\log_{10}\\!\\left(\\frac{c_{\\mathrm{high}}}{c_{\\mathrm{low}}}\\right)",
    parameters: {
      initial_dilute_concentration_molar: {
        kind: "number",
        defaultValue: 0.001,
        min: 0.0001,
        max: 0.001,
      },
      initial_concentrated_concentration_molar: {
        kind: "number",
        defaultValue: 0.1,
        min: 0.001,
        max: 0.1,
      },
      ion_charge: { kind: "integer", defaultValue: 2, min: 1, max: 3 },
    },
  };
}
export { specification as n, initialize as t };
