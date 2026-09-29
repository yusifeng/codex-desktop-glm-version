// Economic-order-quantity teaching model. Release chunk: model-838233d701ed.js.
import "@rchunk/rolldown-runtime";

interface EconomicOrderInput { annualDemand?: number; orderCost?: number; holdingCost?: number }
interface NumericControl { min: number; max: number; step: number; defaultValue: number }

const annualDemandControl = { label: "D\;\text{annual demand}", min: 1_000, max: 6_000, step: 250, defaultValue: 3_500 };
const orderCostControl = { label: "S\;\text{order cost}", min: 25, max: 225, step: 5, defaultValue: 120 };
const holdingCostControl = { label: "H\;\text{holding cost}", min: 4, max: 30, step: 1, defaultValue: 12 };
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);
const normalizeValue = (value: number | undefined, control: NumericControl): number =>
  Number.isFinite(value) ? clamp(value ?? control.defaultValue, control.min, control.max) : control.defaultValue;
const normalizeEconomicOrderInput = (input: EconomicOrderInput) => ({
  annualDemand: normalizeValue(input.annualDemand, annualDemandControl),
  orderCost: normalizeValue(input.orderCost, orderCostControl),
  holdingCost: normalizeValue(input.holdingCost, holdingCostControl),
});
const calculateEconomicOrderQuantity = (input: EconomicOrderInput) => {
  const safe = normalizeEconomicOrderInput(input);
  const eoq = Math.sqrt(2 * safe.annualDemand * safe.orderCost / safe.holdingCost);
  const orderingCostAtEoq = safe.annualDemand * safe.orderCost / eoq;
  const holdingCostAtEoq = safe.holdingCost * eoq / 2;
  return { ...safe, eoq, orderingCostAtEoq, holdingCostAtEoq, totalCostAtEoq: orderingCostAtEoq + holdingCostAtEoq };
};
function initializeEconomicOrderQuantityModel(): void {}

export { initializeEconomicOrderQuantityModel as a, calculateEconomicOrderQuantity as i, holdingCostControl as n, normalizeEconomicOrderInput as o, orderCostControl as r, annualDemandControl as t };
