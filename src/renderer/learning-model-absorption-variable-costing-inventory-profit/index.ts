// Absorption-versus-variable-costing inventory-profit manifest. Release chunk: type-6531d19cb2c0.js.
import "@rchunk/rolldown-runtime";

const absorptionVariableCostingInventoryProfitSpecification = {
  type: "ABSORPTION_VARIABLE_COSTING_INVENTORY_PROFIT",
  version: 2,
  thumbnailAssetKey: "absorption-variable-costing-inventory-profit-v2",
  canonicalFormula: "\\mathrm{OI}_{A}-\\mathrm{OI}_{V}=\\Delta I\\times \\mathrm{FOH}_{u}",
  parameters: {
    unitsProduced: { kind: "integer" as const, defaultValue: 800, min: 100, max: 10_000 },
    unitsSold: { kind: "integer" as const, defaultValue: 600, min: 100, max: 10_000 },
  },
};

function initializeAbsorptionVariableCostingInventoryProfitSpecification(): void {}

export {
  absorptionVariableCostingInventoryProfitSpecification as n,
  initializeAbsorptionVariableCostingInventoryProfitSpecification as t,
};
