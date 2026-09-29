// Subtracting-negative-integers learning model.
import "@rchunk/rolldown-runtime";

interface SubtractingNegativeValues { positiveInteger?: number | null; negativeInteger?: number | null }

const subtractingNegativeIntegersType = "SUBTRACTING_NEGATIVE_INTEGERS";
const subtractingNegativeIntegersThumbnail = "subtracting-negative-integers-v1";
const subtractingNegativeIntegersFormula = "a - n = a + |n|, \\quad n < 0";
const subtractingNegativeIntegersParameters = {
  positiveInteger: { kind: "integer", defaultValue: 7, min: 1, max: 12 },
  negativeInteger: { kind: "integer", defaultValue: -4, min: -12, max: -1 },
};
const subtractingNegativeIntegersDefinition = { type: subtractingNegativeIntegersType, version: 1, thumbnailAssetKey: subtractingNegativeIntegersThumbnail, canonicalFormula: subtractingNegativeIntegersFormula, parameters: subtractingNegativeIntegersParameters };
const positiveIntegerControl = { ...subtractingNegativeIntegersDefinition.parameters.positiveInteger, step: 1 };
const negativeIntegerControl = { ...subtractingNegativeIntegersDefinition.parameters.negativeInteger, step: 1 };
const domainMin = positiveIntegerControl.min - 1;
const domainMax = positiveIntegerControl.max - negativeIntegerControl.min + 1;
const clampInteger = (value: number | null | undefined, minimum: number, maximum: number, fallback: number): number =>
  Math.min(maximum, Math.max(minimum, Math.round(Number.isFinite(value) ? value as number : fallback)));

const normalizeSubtractingNegativeValues = (values: SubtractingNegativeValues) => ({
  positiveInteger: clampInteger(values.positiveInteger, positiveIntegerControl.min, positiveIntegerControl.max, positiveIntegerControl.defaultValue),
  negativeInteger: clampInteger(values.negativeInteger, negativeIntegerControl.min, negativeIntegerControl.max, negativeIntegerControl.defaultValue),
});

function calculateSubtractingNegativeIntegers(values: SubtractingNegativeValues) {
  const normalized = normalizeSubtractingNegativeValues(values);
  const result = normalized.positiveInteger - normalized.negativeInteger;
  const stepCount = Math.abs(normalized.negativeInteger);
  const positions = Array.from({ length: stepCount + 1 }, (_unused, index) => normalized.positiveInteger + index);
  return { ...normalized, result, stepCount, positions, domainMin, domainMax };
}

function initializeSubtractingNegativeIntegersSchema(): void {}
function initializeSubtractingNegativeIntegersModel(): void {}

export {
  calculateSubtractingNegativeIntegers as a,
  normalizeSubtractingNegativeValues as i,
  positiveIntegerControl as n,
  initializeSubtractingNegativeIntegersSchema as o,
  initializeSubtractingNegativeIntegersModel as r,
  subtractingNegativeIntegersDefinition as s,
  negativeIntegerControl as t,
};
