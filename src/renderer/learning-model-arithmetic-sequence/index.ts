// Arithmetic-sequence learning model.
import "@rchunk/rolldown-runtime";

interface ArithmeticSequenceValues { firstTerm?: number | null; commonDifference?: number | null; termNumber?: number | null }

const arithmeticSequenceType = "ARITHMETIC_SEQUENCE";
const arithmeticSequenceThumbnail = "arithmetic-sequence-v1";
const arithmeticSequenceFormula = "a_n = a_1 + (n - 1)d";
const arithmeticSequenceParameters = {
  firstTerm: { kind: "integer", defaultValue: 2, min: -6, max: 6 },
  commonDifference: { kind: "integer", defaultValue: 3, min: -4, max: 4 },
  termNumber: { kind: "integer", defaultValue: 5, min: 1, max: 6 },
};
const arithmeticSequenceDefinition = { type: arithmeticSequenceType, version: 2, thumbnailAssetKey: arithmeticSequenceThumbnail, canonicalFormula: arithmeticSequenceFormula, parameters: arithmeticSequenceParameters };
const firstTermControl = { min: arithmeticSequenceDefinition.parameters.firstTerm.min, max: arithmeticSequenceDefinition.parameters.firstTerm.max, step: 1, defaultValue: arithmeticSequenceDefinition.parameters.firstTerm.defaultValue };
const commonDifferenceControl = { min: arithmeticSequenceDefinition.parameters.commonDifference.min, max: arithmeticSequenceDefinition.parameters.commonDifference.max, step: 1, defaultValue: arithmeticSequenceDefinition.parameters.commonDifference.defaultValue };
const termNumberControl = { min: arithmeticSequenceDefinition.parameters.termNumber.min, max: arithmeticSequenceDefinition.parameters.termNumber.max, step: 1, defaultValue: arithmeticSequenceDefinition.parameters.termNumber.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeInteger = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
  Number.isFinite(value) ? clamp(Math.round(value ?? fallback), minimum, maximum) : fallback;
const normalizeArithmeticSequenceValues = (values: ArithmeticSequenceValues) => ({
  firstTerm: normalizeInteger(values.firstTerm, firstTermControl.defaultValue, firstTermControl.min, firstTermControl.max),
  commonDifference: normalizeInteger(values.commonDifference, commonDifferenceControl.defaultValue, commonDifferenceControl.min, commonDifferenceControl.max),
  termNumber: normalizeInteger(values.termNumber, termNumberControl.defaultValue, termNumberControl.min, termNumberControl.max),
});

function calculateArithmeticSequence(values: ArithmeticSequenceValues) {
  const normalized = normalizeArithmeticSequenceValues(values);
  const hopCount = normalized.termNumber - 1;
  const nthTerm = normalized.firstTerm + hopCount * normalized.commonDifference;
  const terms = Array.from({ length: normalized.termNumber }, (_unused, index) => normalized.firstTerm + index * normalized.commonDifference);
  return { ...normalized, hopCount, nthTerm, terms };
}

function initializeArithmeticSequenceSchema(): void {}
function initializeArithmeticSequenceModel(): void {}

export {
  initializeArithmeticSequenceModel as a,
  arithmeticSequenceDefinition as c,
  calculateArithmeticSequence as i,
  firstTermControl as n,
  normalizeArithmeticSequenceValues as o,
  termNumberControl as r,
  initializeArithmeticSequenceSchema as s,
  commonDifferenceControl as t,
};
