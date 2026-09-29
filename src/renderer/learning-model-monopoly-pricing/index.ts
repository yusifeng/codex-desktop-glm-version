// Monopoly output rule: compare marginal revenue with marginal cost.
import "@rchunk/rolldown-runtime";

interface MonopolyValues { quantity?: number | null }
interface MonopolyState { marginalRevenue: number; marginalCost: number; direction: "expand" | "reduce" | "stop" }

const quantityControl = { min: 5, max: 45, step: 1, defaultValue: 30 };
const monopolyGraphBounds = { quantityMin: 0, quantityMax: 55, valueMin: 0, valueMax: 105 };
const defaultMonopolyValues = { quantity: quantityControl.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeMonopolyValues = (values: MonopolyValues) => ({
  quantity:
    typeof values.quantity === "number" && Number.isFinite(values.quantity)
      ? clamp(values.quantity, quantityControl.min, quantityControl.max)
      : quantityControl.defaultValue,
});
const demandPrice = (quantity: number): number => 100 - quantity;
const marginalRevenue = (quantity: number): number => 100 - 2 * quantity;
const marginalCost = (quantity: number): number => 10 + quantity;
const optimumQuantity = 30;

function calculateMonopolyPricing(values: MonopolyValues) {
  const normalized = normalizeMonopolyValues(values);
  const revenue = marginalRevenue(normalized.quantity);
  const cost = marginalCost(normalized.quantity);
  const difference = revenue - cost;
  return {
    ...normalized,
    price: demandPrice(normalized.quantity),
    marginalRevenue: revenue,
    marginalCost: cost,
    optimumQuantity,
    optimumPrice: demandPrice(optimumQuantity),
    direction: Math.abs(difference) < 1e-9 ? "stop" : difference > 0 ? "expand" : "reduce",
  };
}

function requiredComparisonPrecision(state: MonopolyState): number {
  if (state.direction === "stop") return 1;
  for (let digits = 1; digits <= 10; digits += 1) {
    const scale = 10 ** digits;
    if (Math.round(state.marginalRevenue * scale) !== Math.round(state.marginalCost * scale)) return digits;
  }
  return 10;
}

function initializeMonopolyPricingModel(): void {}

export {
  demandPrice as a,
  requiredComparisonPrecision as c,
  calculateMonopolyPricing as i,
  initializeMonopolyPricingModel as l,
  defaultMonopolyValues as n,
  marginalCost as o,
  quantityControl as r,
  marginalRevenue as s,
  monopolyGraphBounds as t,
  normalizeMonopolyValues as u,
};
