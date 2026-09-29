// Product-of-powers exponent-rule model. Release chunk: model-bc3894cd0f1f.js.
import "@rchunk/rolldown-runtime";

interface ExponentProductInput { leftExponent?: number; rightExponent?: number }

const leftExponentControl = { label: "First exponent", min: 1, max: 5, step: 1, defaultValue: 2 };
const rightExponentControl = { label: "Second exponent", min: 1, max: 5, step: 1, defaultValue: 3 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeExponent = (value: number | undefined, fallback: number, minimum: number, maximum: number): number => typeof value === "number" && Number.isFinite(value) ? clamp(Math.round(value), minimum, maximum) : fallback;
const makeFactors = (count: number): string[] => Array.from({ length: count }, () => "x");
const normalizeExponentProductInput = (input: ExponentProductInput) => ({
  leftExponent: normalizeExponent(input.leftExponent, leftExponentControl.defaultValue, leftExponentControl.min, leftExponentControl.max),
  rightExponent: normalizeExponent(input.rightExponent, rightExponentControl.defaultValue, rightExponentControl.min, rightExponentControl.max),
});
const calculateExponentProduct = (input: ExponentProductInput) => {
  const safeValues = normalizeExponentProductInput(input);
  const leftFactors = makeFactors(safeValues.leftExponent);
  const rightFactors = makeFactors(safeValues.rightExponent);
  return {
    safeValues,
    totalExponent: safeValues.leftExponent + safeValues.rightExponent,
    leftFactors,
    rightFactors,
    mergedFactors: [...leftFactors.map((_factor, index) => ({ source: "left", key: `left-${index}` })), ...rightFactors.map((_factor, index) => ({ source: "right", key: `right-${index}` }))],
  };
};
const exponentProductLatex = (input: ExponentProductInput): string => {
  const result = calculateExponentProduct(input);
  const { leftExponent, rightExponent } = result.safeValues;
  return `x^{${leftExponent}} \\cdot x^{${rightExponent}} = x^{${leftExponent}+${rightExponent}} = x^{${result.totalExponent}}`;
};
function initializeExponentProductModel(): void {}

export { initializeExponentProductModel as a, calculateExponentProduct as i, rightExponentControl as n, normalizeExponentProductInput as o, exponentProductLatex as r, leftExponentControl as t };
