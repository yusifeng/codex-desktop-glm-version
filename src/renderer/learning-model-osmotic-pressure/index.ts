// Osmotic-pressure learning-model manifest. Release chunk: type-278df50fffd4.js.
import "@rchunk/rolldown-runtime";

const osmoticPressureSpecification = {
  type: "OSMOTIC_PRESSURE",
  version: 2,
  thumbnailAssetKey: "osmotic-pressure-v2",
  canonicalFormula: "\\pi = i c R T",
  parameters: {
    solute_concentration_molar: { kind: "number" as const, defaultValue: 0.2, min: 0.05, max: 0.5 },
    vant_hoff_factor: { kind: "number" as const, defaultValue: 2, min: 1, max: 3 },
    temperature_kelvin: { kind: "number" as const, defaultValue: 298, min: 273, max: 323 },
  },
};

function initializeOsmoticPressureSpecification(): void {}

export { osmoticPressureSpecification as n, initializeOsmoticPressureSpecification as t };
