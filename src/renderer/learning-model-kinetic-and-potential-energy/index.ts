// Kinetic-and-potential-energy learning-model manifest. Release chunk: type-e25b068b7941.js.
import "@rchunk/rolldown-runtime";

const kineticAndPotentialEnergySpecification = {
  type: "KINETIC_AND_POTENTIAL_ENERGY",
  version: 1,
  thumbnailAssetKey: "kinetic-and-potential-energy-v1",
  canonicalFormula: "E_{\\text{total}} = PE + KE",
  parameters: {
    startHeightMeters: { kind: "number" as const, defaultValue: 6, min: 2, max: 10 },
  },
};

function initializeKineticAndPotentialEnergySpecification(): void {}

export { kineticAndPotentialEnergySpecification as n, initializeKineticAndPotentialEnergySpecification as t };
