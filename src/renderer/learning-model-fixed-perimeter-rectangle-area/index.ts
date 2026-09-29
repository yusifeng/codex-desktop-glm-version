// Fixed-perimeter rectangle model: maximize area when the rectangle is a square.
import "@rchunk/rolldown-runtime";

const rectangleAreaSchema = {
  type: "FIXED_PERIMETER_RECTANGLE_AREA",
  version: 1,
  thumbnailAssetKey: "fixed-perimeter-rectangle-area-v1",
  canonicalFormula: "A = w \\times h",
  parameters: { width: { kind: "number", defaultValue: 4, min: 1, max: 11 } },
};
const widthControl = {
  label: "w",
  min: rectangleAreaSchema.parameters.width.min,
  max: rectangleAreaSchema.parameters.width.max,
  step: 0.5,
  defaultValue: rectangleAreaSchema.parameters.width.defaultValue,
  thumbnailDefaultValue: 6,
};
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeWidth = (value: number): number => clamp(Number.isFinite(value) ? value : widthControl.defaultValue, widthControl.min, widthControl.max);
const calculateRectangleArea = (value: number) => {
  const width = normalizeWidth(value);
  const height = 12 - width;
  return { width, height, area: width * height, isMaximum: width === 6 };
};
function initializeRectangleAreaSchema(): void {}
function initializeRectangleAreaModel(): void {}

export { initializeRectangleAreaSchema as a, normalizeWidth as i, calculateRectangleArea as n, rectangleAreaSchema as o, initializeRectangleAreaModel as r, widthControl as t };
