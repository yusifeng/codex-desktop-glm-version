// Difference-in-differences learning-model manifest. Release chunk: type-dae3a0497d9a.js.
import "@rchunk/rolldown-runtime";

const differenceInDifferencesSpecification = {
  type: "DIFFERENCE_IN_DIFFERENCES",
  version: 2,
  thumbnailAssetKey: "difference-in-differences-v1",
  canonicalFormula: "\\widehat{\\tau}_{DiD} = \\Delta Y_T - \\Delta Y_C",
  parameters: {
    treated_pre_outcome: { kind: "number" as const, defaultValue: 60, min: 20, max: 80 },
    control_pre_outcome: { kind: "number" as const, defaultValue: 40, min: 20, max: 80 },
    common_change: { kind: "number" as const, defaultValue: 8, min: -15, max: 15 },
    treatment_effect: { kind: "number" as const, defaultValue: 14, min: -20, max: 20 },
  },
};

function initializeDifferenceInDifferencesSpecification(): void {}

export {
  differenceInDifferencesSpecification as n,
  initializeDifferenceInDifferencesSpecification as t,
};
