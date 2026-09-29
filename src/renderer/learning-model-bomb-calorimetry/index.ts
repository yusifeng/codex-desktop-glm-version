// Bomb-calorimetry learning-model manifest. Release chunk: type-85e042e70c11.js.
import "@rchunk/rolldown-runtime";

const bombCalorimetrySpecification = {
  type: "BOMB_CALORIMETRY",
  version: 2,
  thumbnailAssetKey: "bomb-calorimetry-v3",
  parameters: {
    sample_mass_g: { kind: "number" as const, defaultValue: 1, min: 0.25, max: 2 },
    combustion_energy_kj_per_g: { kind: "number" as const, defaultValue: 24, min: 15, max: 35 },
    calorimeter_heat_capacity_kj_per_k: { kind: "number" as const, defaultValue: 12, min: 8, max: 25 },
  },
};

function initializeBombCalorimetrySpecification(): void {}

export { bombCalorimetrySpecification as n, initializeBombCalorimetrySpecification as t };
