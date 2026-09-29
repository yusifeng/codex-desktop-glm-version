// Adding a negative integer as leftward movement on a number line.
import "@rchunk/rolldown-runtime";

interface IntegerParameter { kind: "integer"; defaultValue: number; min: number; max: number }
interface AddingNegativeValues { positiveInteger?: number; negativeInteger?: number }

const addingNegativeIntegerType = "ADDING_NEGATIVE_INTEGER";
const addingNegativeIntegerThumbnail = "adding-negative-integer-v1";
const addingNegativeIntegerParameters: { positiveInteger: IntegerParameter; negativeInteger: IntegerParameter } = {
  positiveInteger: { kind: "integer", defaultValue: 7, min: 1, max: 12 },
  negativeInteger: { kind: "integer", defaultValue: -4, min: -12, max: -1 },
};
const addingNegativeIntegerSpecification = {
  type: addingNegativeIntegerType,
  version: 1,
  thumbnailAssetKey: addingNegativeIntegerThumbnail,
  parameters: addingNegativeIntegerParameters,
};
const positiveIntegerControl = { ...addingNegativeIntegerSpecification.parameters.positiveInteger, step: 1 };
const negativeIntegerControl = { ...addingNegativeIntegerSpecification.parameters.negativeInteger, step: 1 };
const domainMin = positiveIntegerControl.min + negativeIntegerControl.min - 1;
const domainMax = positiveIntegerControl.max + 1;

const normalizeInteger = (value: number | undefined, minimum: number, maximum: number, fallback: number): number =>
  Math.min(maximum, Math.max(minimum, Math.round(typeof value === "number" && Number.isFinite(value) ? value : fallback)));
const normalizeAddingNegativeValues = (values: AddingNegativeValues) => ({
  positiveInteger: normalizeInteger(values.positiveInteger, positiveIntegerControl.min, positiveIntegerControl.max, positiveIntegerControl.defaultValue),
  negativeInteger: normalizeInteger(values.negativeInteger, negativeIntegerControl.min, negativeIntegerControl.max, negativeIntegerControl.defaultValue),
});
const calculateAddingNegativeInteger = (values: AddingNegativeValues) => {
  const normalized = normalizeAddingNegativeValues(values);
  const result = normalized.positiveInteger + normalized.negativeInteger;
  const stepCount = Math.abs(normalized.negativeInteger);
  const positions = Array.from({ length: stepCount + 1 }, (_unused, index) => normalized.positiveInteger - index);
  return { ...normalized, result, stepCount, positions, domainMin, domainMax };
};

function initializeAddingNegativeIntegerSpecification(): void {}
function initializeAddingNegativeIntegerModel(): void {}

export {
  calculateAddingNegativeInteger as a,
  normalizeAddingNegativeValues as i,
  positiveIntegerControl as n,
  initializeAddingNegativeIntegerSpecification as o,
  initializeAddingNegativeIntegerModel as r,
  addingNegativeIntegerSpecification as s,
  negativeIntegerControl as t,
};
