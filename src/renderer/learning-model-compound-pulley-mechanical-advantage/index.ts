// Compound-pulley mechanical-advantage manifest. Release chunk: type-2eeac8e139a3.js.
import "@rchunk/rolldown-runtime";

const compoundPulleyMechanicalAdvantageSpecification = {
  type: "COMPOUND_PULLEY_MECHANICAL_ADVANTAGE",
  version: 1,
  thumbnailAssetKey: "compound-pulley-mechanical-advantage-v1",
  canonicalFormula: "\\mathrm{IMA}=n",
  parameters: {
    supportSegments: { kind: "integer" as const, defaultValue: 2, min: 2, max: 6 },
  },
};

function initializeCompoundPulleyMechanicalAdvantageSpecification(): void {}

export {
  compoundPulleyMechanicalAdvantageSpecification as n,
  initializeCompoundPulleyMechanicalAdvantageSpecification as t,
};
