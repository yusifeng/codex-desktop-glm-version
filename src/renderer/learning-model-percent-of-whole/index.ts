// Percent-of-a-whole teaching model. Release chunk: model-d5476457f411.js.
import "@rchunk/rolldown-runtime";

interface PercentInput { percent?: number }

const percentControl = { label: "Percent of the whole", min: 0, max: 100, step: 1, defaultValue: 37 };
const totalParts = 100;
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);
const normalizePercent = (value: number | undefined): number =>
  Number.isFinite(value)
    ? Math.round(clamp(value ?? percentControl.defaultValue, percentControl.min, percentControl.max))
    : percentControl.defaultValue;
const normalizePercentInput = (input: PercentInput) => ({ percent: normalizePercent(input.percent) });
const calculatePercentOfWhole = (input: PercentInput) => {
  const { percent } = normalizePercentInput(input);
  const decimal = percent / totalParts;
  return { percent, highlightedParts: percent, totalParts, decimal, decimalLabel: decimal.toFixed(2) };
};
function initializePercentOfWholeModel(): void {}

export { normalizePercentInput as i, calculatePercentOfWhole as n, initializePercentOfWholeModel as r, percentControl as t };
