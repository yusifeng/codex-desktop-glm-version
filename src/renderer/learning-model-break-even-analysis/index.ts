// Break-even analysis model: solve quantity and revenue from fixed cost and contribution margin.
import "@rchunk/rolldown-runtime";

interface BreakEvenInput { fixedCost?: number | null; variableCost?: number | null; price?: number | null }

const fixedCostControl = { label: "F\;\n\\text{fixed cost}", min: 0, max: 1000, step: 25, defaultValue: 400 };
const variableCostControl = { label: "v\;\n\\text{unit cost}", min: 0, max: 40, step: 1, defaultValue: 12 };
const priceControl = { label: "p\;\n\\text{price}", min: 5, max: 60, step: 1, defaultValue: 32 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeValue = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number => Number.isFinite(value) ? clamp(value ?? fallback, minimum, maximum) : fallback;
const normalizeBreakEvenInput = (input: BreakEvenInput) => ({
  fixedCost: normalizeValue(input.fixedCost, fixedCostControl.defaultValue, fixedCostControl.min, fixedCostControl.max),
  variableCost: normalizeValue(input.variableCost, variableCostControl.defaultValue, variableCostControl.min, variableCostControl.max),
  price: normalizeValue(input.price, priceControl.defaultValue, priceControl.min, priceControl.max),
});
const calculateBreakEven = (input: BreakEvenInput) => {
  const normalized = normalizeBreakEvenInput(input);
  const contributionMargin = normalized.price - normalized.variableCost;
  const hasBreakEven = contributionMargin > 0;
  const breakEvenQuantity = hasBreakEven ? normalized.fixedCost / contributionMargin : null;
  return { ...normalized, contributionMargin, breakEvenQuantity, breakEvenRevenue: breakEvenQuantity === null ? null : breakEvenQuantity * normalized.price, hasBreakEven };
};
function initializeBreakEvenAnalysisModel(): void {}

export { initializeBreakEvenAnalysisModel as a, calculateBreakEven as i, priceControl as n, normalizeBreakEvenInput as o, variableCostControl as r, fixedCostControl as t };
