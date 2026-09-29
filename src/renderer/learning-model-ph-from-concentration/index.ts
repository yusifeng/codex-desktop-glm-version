// Hydronium concentration to pH metadata. Release chunk: type-5afefdccef0f.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "PH_FROM_CONCENTRATION";
  version: 2;
  thumbnailAssetKey: "ph-from-concentration-v1";
  canonicalFormula: string;
  parameters: {
    hydronium_concentration_molar: {
      kind: "number";
      defaultValue: 1e-7;
      min: 1e-12;
      max: 0.01;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "PH_FROM_CONCENTRATION",
    version: 2,
    thumbnailAssetKey: "ph-from-concentration-v1",
    canonicalFormula: "\\mathrm{pH}=-\\log_{10}([\\mathrm{H_3O^+}])",
    parameters: {
      hydronium_concentration_molar: {
        kind: "number",
        defaultValue: 1e-7,
        min: 1e-12,
        max: 0.01,
      },
    },
  };
}
export { specification as n, initialize as t };
