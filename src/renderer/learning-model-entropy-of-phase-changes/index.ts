// Phase-change entropy learning-model manifest. Release chunk: type-a2cf34c518e9.js.
import "@rchunk/rolldown-runtime";

const entropyOfPhaseChangesSpecification = {
  type: "ENTROPY_OF_PHASE_CHANGES",
  version: 2,
  thumbnailAssetKey: "entropy-of-phase-changes-v1",
  canonicalFormula: "\\Delta S_{\\mathrm{phase}}=\\frac{\\Delta H_{\\mathrm{phase}}}{T_{\\mathrm{phase}}}",
  parameters: {
    melting_temperature_k: { kind: "number" as const, defaultValue: 273.15, min: 200, max: 350 },
    boiling_temperature_k: { kind: "number" as const, defaultValue: 373.15, min: 360, max: 650 },
    molar_enthalpy_of_fusion_kj_per_mol: {
      kind: "number" as const,
      defaultValue: 6.01,
      min: 2,
      max: 20,
    },
    molar_enthalpy_of_vaporization_kj_per_mol: {
      kind: "number" as const,
      defaultValue: 40.65,
      min: 20,
      max: 100,
    },
  },
};

function initializeEntropyOfPhaseChangesSpecification(): void {}

export {
  entropyOfPhaseChangesSpecification as n,
  initializeEntropyOfPhaseChangesSpecification as t,
};
