// Maxwell-Boltzmann distribution manifest. Release chunk: type-505786a161fa.js.
import "@rchunk/rolldown-runtime";

const maxwellBoltzmannDistributionSpecification = {
  type: "MAXWELL_BOLTZMANN_DISTRIBUTION",
  version: 2,
  thumbnailAssetKey: "maxwell-boltzmann-distribution-v1",
  parameters: {
    temperature_kelvin: { kind: "number" as const, defaultValue: 300, min: 200, max: 800 },
    molar_mass_g_per_mol: { kind: "number" as const, defaultValue: 28, min: 4, max: 80 },
  },
};

function initializeMaxwellBoltzmannDistributionSpecification(): void {}

export {
  maxwellBoltzmannDistributionSpecification as n,
  initializeMaxwellBoltzmannDistributionSpecification as t,
};
