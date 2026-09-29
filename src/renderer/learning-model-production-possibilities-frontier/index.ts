// Production-possibilities-frontier manifest. Release chunk: type-b11bc1c3afbb.js.
import "@rchunk/rolldown-runtime";

const productionPossibilitiesFrontierSpecification = {
  type: "PRODUCTION_POSSIBILITIES_FRONTIER",
  version: 1,
  thumbnailAssetKey: "production-possibilities-frontier-v1",
  parameters: {
    consumerGoods: { kind: "number" as const, defaultValue: 50, min: 0, max: 100 },
    capitalGoods: { kind: "number" as const, defaultValue: 75, min: 0, max: 100 },
  },
};

function initializeProductionPossibilitiesFrontierSpecification(): void {}

export {
  productionPossibilitiesFrontierSpecification as n,
  initializeProductionPossibilitiesFrontierSpecification as t,
};
