// Odd-number square-sum teaching model. Release chunk: model-439233109749.js.
import "@rchunk/rolldown-runtime";

interface OddNumberSquareInput { n?: number }

const termCountControl = { min: 1, max: 8, step: 1, defaultValue: 5, thumbnailValue: 4 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeTermCount = (value: number | undefined): number => {
  const finiteValue = typeof value === "number" && Number.isFinite(value) ? value : termCountControl.defaultValue;
  return clamp(Math.round(finiteValue), termCountControl.min, termCountControl.max);
};
const normalizeOddNumberSquareInput = (input: OddNumberSquareInput) => ({ n: normalizeTermCount(input.n) });
const calculateOddNumberSquareSum = (input: OddNumberSquareInput) => {
  const { n } = normalizeOddNumberSquareInput(input);
  const terms = Array.from({ length: n }, (_, index) => index * 2 + 1);
  const newestOddNumber = terms[terms.length - 1] ?? 1;
  const squareArea = n * n;
  return { n, newestOddNumber, squareArea, terms, sumLatex: `${terms.join("+")}=${squareArea}=${n}^{2}` };
};
function initializeOddNumberSquareSumModel(): void {}

export { normalizeTermCount as i, calculateOddNumberSquareSum as n, initializeOddNumberSquareSumModel as r, termCountControl as t };
