// Solution-dilution learning-model manifest. Release chunk: type-b20da9986277.js.
import "@rchunk/rolldown-runtime";

const solutionDilutionSpecification = {
  type: "SOLUTION_DILUTION",
  version: 1,
  thumbnailAssetKey: "solution-dilution-v2",
  canonicalFormula: "M_1V_1=M_2V_2",
  parameters: {
    initialConcentrationMolesPerLiter: { kind: "number" as const, defaultValue: 1.5, min: 0.1, max: 3 },
    initialVolumeLiters: { kind: "number" as const, defaultValue: 2, min: 0.5, max: 5 },
    waterAddedLiters: { kind: "number" as const, defaultValue: 3, min: 0, max: 5 },
  },
};

function initializeSolutionDilutionSpecification(): void {}

export { solutionDilutionSpecification as n, initializeSolutionDilutionSpecification as t };
