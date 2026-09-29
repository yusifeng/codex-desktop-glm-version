// GHK membrane-potential permeability controls. Release chunk: type-b2f3bbb776a0.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "GHK_MEMBRANE_POTENTIAL";
  version: 1;
  thumbnailAssetKey: "ghk-membrane-potential-v1";
  canonicalFormula: string;
  parameters: {
    sodiumToPotassiumPermeabilityRatio: {
      kind: "number";
      defaultValue: 0.04;
      min: 0;
      max: 1;
    };
    chlorideToPotassiumPermeabilityRatio: {
      kind: "number";
      defaultValue: 0.45;
      min: 0;
      max: 1;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "GHK_MEMBRANE_POTENTIAL",
    version: 1,
    thumbnailAssetKey: "ghk-membrane-potential-v1",
    canonicalFormula:
      "P_{\\mathrm{ion}}\\uparrow \\Rightarrow V_m \\to E_{\\mathrm{ion}}",
    parameters: {
      sodiumToPotassiumPermeabilityRatio: {
        kind: "number",
        defaultValue: 0.04,
        min: 0,
        max: 1,
      },
      chlorideToPotassiumPermeabilityRatio: {
        kind: "number",
        defaultValue: 0.45,
        min: 0,
        max: 1,
      },
    },
  };
}
export { specification as n, initialize as t };
