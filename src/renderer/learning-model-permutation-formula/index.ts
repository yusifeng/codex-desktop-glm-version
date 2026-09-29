// Permutation formula metadata. Release chunk: type-df7c33e35927.js.
import "@rchunk/rolldown-runtime";

interface PermutationFormulaSpecification {
  type: "PERMUTATION_FORMULA";
  version: 1;
  thumbnailAssetKey: "permutation-formula-v1";
  parameters: {
    n: { kind: "integer"; defaultValue: 6; min: 4; max: 8 };
    r: { kind: "integer"; defaultValue: 3; min: 2; max: 4 };
  };
}

let permutationFormulaSpecification: PermutationFormulaSpecification;
let initialized = false;
function initializePermutationFormulaSpecification(): void {
  if (initialized) return;
  initialized = true;
  permutationFormulaSpecification = {
    type: "PERMUTATION_FORMULA",
    version: 1,
    thumbnailAssetKey: "permutation-formula-v1",
    parameters: {
      n: { kind: "integer", defaultValue: 6, min: 4, max: 8 },
      r: { kind: "integer", defaultValue: 3, min: 2, max: 4 },
    },
  };
}

export {
  permutationFormulaSpecification as n,
  initializePermutationFormulaSpecification as t,
};
