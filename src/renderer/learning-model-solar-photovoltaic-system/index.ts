// Solar-photovoltaic-system learning-model manifest. Release chunk: type-f31fc951c570.js.
import "@rchunk/rolldown-runtime";

const solarPhotovoltaicSystemSpecification = {
  type: "SOLAR_PHOTOVOLTAIC_SYSTEM",
  version: 2,
  thumbnailAssetKey: "solar-photovoltaic-system-v2",
  parameters: {
    array_capacity_kw: { kind: "number" as const, defaultValue: 6, min: 1, max: 20 },
  },
};

function initializeSolarPhotovoltaicSystemSpecification(): void {}

export { solarPhotovoltaicSystemSpecification as n, initializeSolarPhotovoltaicSystemSpecification as t };
