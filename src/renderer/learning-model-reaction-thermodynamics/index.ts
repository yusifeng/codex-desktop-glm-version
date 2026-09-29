// Reaction-thermodynamics controls. Release chunk: type-67623f2e9dfc.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "REACTION_THERMODYNAMICS";
  version: 1;
  thumbnailAssetKey: "reaction-thermodynamics-v1";
  canonicalFormula: string;
  parameters: {
    activationEnergyKilojoulesPerMole: {
      kind: "number";
      defaultValue: 90;
      min: 50;
      max: 150;
    };
    enthalpyChangeKilojoulesPerMole: {
      kind: "number";
      defaultValue: -30;
      min: -60;
      max: 40;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "REACTION_THERMODYNAMICS",
    version: 1,
    thumbnailAssetKey: "reaction-thermodynamics-v1",
    canonicalFormula:
      "\\Delta H = H_{\\mathrm{products}} - H_{\\mathrm{reactants}}",
    parameters: {
      activationEnergyKilojoulesPerMole: {
        kind: "number",
        defaultValue: 90,
        min: 50,
        max: 150,
      },
      enthalpyChangeKilojoulesPerMole: {
        kind: "number",
        defaultValue: -30,
        min: -60,
        max: 40,
      },
    },
  };
}
export { specification as n, initialize as t };
