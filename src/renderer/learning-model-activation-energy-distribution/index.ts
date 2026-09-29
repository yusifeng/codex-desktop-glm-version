// Activation-energy distribution manifest. Release chunk: type-62dc7c323bbd.js.
import "@rchunk/rolldown-runtime";

const activationEnergyDistributionSpecification = {
  type: "ACTIVATION_ENERGY_DISTRIBUTION",
  version: 2,
  thumbnailAssetKey: "activation-energy-distribution-v1",
  parameters: {
    initial_temperature_k: { kind: "number" as const, defaultValue: 600, min: 300, max: 900 },
    activation_energy_kj_mol: { kind: "number" as const, defaultValue: 16, min: 8, max: 28 },
  },
};

function initializeActivationEnergyDistributionSpecification(): void {}

export {
  activationEnergyDistributionSpecification as n,
  initializeActivationEnergyDistributionSpecification as t,
};
