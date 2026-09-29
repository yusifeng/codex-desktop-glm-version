// Absolute-value distance learning model: interpret |x| as distance from zero.
import "@rchunk/rolldown-runtime";

interface AbsoluteValueInput { x?: number | null }

const absoluteValueSchema = {
  type: "ABSOLUTE_VALUE_DISTANCE",
  version: 1,
  thumbnailAssetKey: "absolute-value-distance-v1",
  canonicalFormula: "|x|",
  parameters: { x: { kind: "number", defaultValue: -3, min: -6, max: 6 } },
};
const inputStep = 0.5;
const inputControl = {
  min: absoluteValueSchema.parameters.x.min,
  max: absoluteValueSchema.parameters.x.max,
  step: inputStep,
  defaultValue: absoluteValueSchema.parameters.x.defaultValue,
};
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeX = (value: number | null | undefined): number => {
  if (!Number.isFinite(value)) return inputControl.defaultValue;
  const normalized = clamp(value ?? inputControl.defaultValue, inputControl.min, inputControl.max);
  return Object.is(normalized, -0) ? 0 : normalized;
};
const calculateAbsoluteValueDistance = (input: AbsoluteValueInput) => {
  const x = normalizeX(input.x);
  return { x, distance: Math.abs(x), isNegative: x < 0 };
};
const formatCoordinate = (value: number): string => Number(value.toFixed(1)).toString();
function initializeAbsoluteValueSchema(): void {}
function initializeAbsoluteValueModel(): void {}

export { initializeAbsoluteValueModel as a, absoluteValueSchema as c, calculateAbsoluteValueDistance as i, inputStep as n, normalizeX as o, formatCoordinate as r, initializeAbsoluteValueSchema as s, inputControl as t };
