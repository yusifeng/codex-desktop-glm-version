// DC-circuit power manifest. Release chunk: type-4140aed3b047.js.
import "@rchunk/rolldown-runtime";

const dcCircuitPowerSpecification = {
  type: "DC_CIRCUIT_POWER",
  version: 1,
  thumbnailAssetKey: "dc-circuit-power-v1",
  canonicalFormula: "P = VI",
  parameters: {
    voltageVolts: { kind: "number" as const, defaultValue: 12, min: 1, max: 24 },
    resistanceOhms: { kind: "number" as const, defaultValue: 6, min: 1, max: 24 },
  },
};

function initializeDcCircuitPowerSpecification(): void {}

export { dcCircuitPowerSpecification as n, initializeDcCircuitPowerSpecification as t };
