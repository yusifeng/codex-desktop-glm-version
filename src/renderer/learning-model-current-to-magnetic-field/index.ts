// Magnetic-field circulation around a straight current-carrying wire.
import "@rchunk/rolldown-runtime";

type CurrentDirection = "up" | "down";
interface CurrentValues { currentDirection?: unknown; currentStrengthAmperes?: unknown }

const currentToMagneticFieldType = "CURRENT_TO_MAGNETIC_FIELD";
const currentToMagneticFieldThumbnail = "current-to-magnetic-field-v3";
const currentToMagneticFieldFormula = "B = \\frac{\\mu_0 I}{2\\pi r}";
const currentToMagneticFieldParameters = {
  currentDirection: { kind: "enum" as const, defaultValue: "up" as CurrentDirection, allowedValues: ["up", "down"] as CurrentDirection[] },
  currentStrengthAmperes: { kind: "number" as const, defaultValue: 5, min: 1, max: 10 },
};
const currentToMagneticFieldSpecification = { type: currentToMagneticFieldType, version: 1, thumbnailAssetKey: currentToMagneticFieldThumbnail, canonicalFormula: currentToMagneticFieldFormula, parameters: currentToMagneticFieldParameters };
const currentDefaults = {
  currentDirection: currentToMagneticFieldSpecification.parameters.currentDirection.defaultValue,
  currentStrengthAmperes: currentToMagneticFieldSpecification.parameters.currentStrengthAmperes.defaultValue,
  allowedDirections: currentToMagneticFieldSpecification.parameters.currentDirection.allowedValues,
  minStrength: currentToMagneticFieldSpecification.parameters.currentStrengthAmperes.min,
  maxStrength: currentToMagneticFieldSpecification.parameters.currentStrengthAmperes.max,
};
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const isCurrentDirection = (value: unknown): value is CurrentDirection => currentDefaults.allowedDirections.some((direction) => direction === value);
const normalizeCurrentValues = (values: CurrentValues) => {
  const direction = isCurrentDirection(values.currentDirection) ? values.currentDirection : currentDefaults.currentDirection;
  const strength = typeof values.currentStrengthAmperes === "number" && Number.isFinite(values.currentStrengthAmperes) ? values.currentStrengthAmperes : currentDefaults.currentStrengthAmperes;
  return { currentDirection: direction, currentStrengthAmperes: clamp(strength, currentDefaults.minStrength, currentDefaults.maxStrength) };
};
const magneticFieldCirculation = (direction: CurrentDirection): "counterclockwise" | "clockwise" => direction === "up" ? "counterclockwise" : "clockwise";
const magneticFieldDirectionVector = (direction: CurrentDirection, angle: number, radius: number, arrowLength: number) => {
  const directionSign = direction === "up" ? -1 : 1;
  const x = -radius * Math.sin(angle) * directionSign;
  const y = arrowLength * Math.cos(angle) * directionSign;
  const magnitude = Math.hypot(x, y) || 1;
  return { x: x / magnitude, y: y / magnitude };
};
const normalizedCurrentStrength = (strength: number): number => clamp(strength, 0, currentDefaults.maxStrength) / currentDefaults.maxStrength;

function initializeCurrentToMagneticFieldSpecification(): void {}
function initializeCurrentToMagneticFieldModel(): void {}

export { initializeCurrentToMagneticFieldModel as a, currentToMagneticFieldSpecification as c, normalizedCurrentStrength as i, magneticFieldCirculation as n, normalizeCurrentValues as o, magneticFieldDirectionVector as r, initializeCurrentToMagneticFieldSpecification as s, currentDefaults as t };
