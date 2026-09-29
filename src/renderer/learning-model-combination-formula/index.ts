// Combination formula metadata. Release chunk: type-e23de7285313.js.
import "@rchunk/rolldown-runtime";

interface CombinationFormulaSpecification {
  type: "COMBINATION_FORMULA";
  version: 2;
  thumbnailAssetKey: "combination-formula-v1";
  parameters: {
    n: { kind: "integer"; defaultValue: 6; min: 4; max: 8 };
    r: { kind: "integer"; defaultValue: 3; min: 2; max: 4 };
  };
}

let combinationFormulaSpecification: CombinationFormulaSpecification;
let initialized = false;
function initializeCombinationFormulaSpecification(): void {
  if (initialized) return;
  initialized = true;
  combinationFormulaSpecification = {
    type: "COMBINATION_FORMULA",
    version: 2,
    thumbnailAssetKey: "combination-formula-v1",
    parameters: {
      n: { kind: "integer", defaultValue: 6, min: 4, max: 8 },
      r: { kind: "integer", defaultValue: 3, min: 2, max: 4 },
    },
  };
}

export {
  combinationFormulaSpecification as n,
  initializeCombinationFormulaSpecification as t,
};
