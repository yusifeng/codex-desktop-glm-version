// Arithmetic-sequence sum-formula teaching model. Release chunk: model-3985c0526691.js.
import "@rchunk/rolldown-runtime";

interface ArithmeticSequenceInput { termCount?: number; firstTerm?: number; commonDifference?: number }
interface NumericControl { min: number; max: number; step: number; defaultValue: number }

const termCountControl = { min: 3, max: 10, step: 1, defaultValue: 6 };
const firstTermControl = { min: 1, max: 8, step: 1, defaultValue: 2 };
const commonDifferenceControl = { min: 1, max: 5, step: 1, defaultValue: 3 };
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);
const normalizeInteger = (value: number | undefined, control: NumericControl): number =>
  Number.isFinite(value)
    ? Math.round(clamp(value ?? control.defaultValue, control.min, control.max))
    : control.defaultValue;
const normalizeArithmeticSequenceInput = (input: ArithmeticSequenceInput) => ({
  termCount: normalizeInteger(input.termCount, termCountControl),
  firstTerm: normalizeInteger(input.firstTerm, firstTermControl),
  commonDifference: normalizeInteger(input.commonDifference, commonDifferenceControl),
});
const calculateArithmeticSequenceSum = (input: ArithmeticSequenceInput) => {
  const safe = normalizeArithmeticSequenceInput(input);
  const terms = Array.from({ length: safe.termCount }, (_unused, index) => safe.firstTerm + index * safe.commonDifference);
  const reversedTerms = [...terms].reverse();
  const lastTerm = terms[terms.length - 1] ?? safe.firstTerm;
  const pairTotal = safe.firstTerm + lastTerm;
  const averageTerm = pairTotal / 2;
  const doubledSum = safe.termCount * pairTotal;
  return { ...safe, terms, reversedTerms, lastTerm, pairTotal, averageTerm, doubledSum, sum: doubledSum / 2 };
};
function initializeArithmeticSequenceModel(): void {}

export { initializeArithmeticSequenceModel as a, calculateArithmeticSequenceSum as i, firstTermControl as n, normalizeArithmeticSequenceInput as o, termCountControl as r, commonDifferenceControl as t };
