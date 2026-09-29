// Even-, odd-, and neither-function symmetry learning model.
import "@rchunk/rolldown-runtime";

type SymmetryType = "even" | "odd" | "neither";
interface FunctionSymmetryValues { symmetryType?: unknown; x?: number | null }

const functionSymmetryType = "EVEN_ODD_FUNCTION_SYMMETRY";
const functionSymmetryThumbnail = "even-odd-function-symmetry-v1";
const functionSymmetryParameters = {
  symmetryType: { kind: "enum", defaultValue: "even" as SymmetryType, allowedValues: ["even", "odd", "neither"] as SymmetryType[] },
  x: { kind: "number", defaultValue: 3, min: 1.25, max: 4.5 },
};
const functionSymmetryDefinition = { type: functionSymmetryType, version: 1, thumbnailAssetKey: functionSymmetryThumbnail, parameters: functionSymmetryParameters };
const xControl = { ...functionSymmetryDefinition.parameters.x, step: 0.25 };
const symmetryOptions = functionSymmetryDefinition.parameters.symmetryType.allowedValues.map((symmetryType, value) => ({ value, symmetryType }));
const symmetryFormulas: Record<SymmetryType, string> = {
  even: "y = 0.2x^2 - 2",
  odd: "y = 0.025x^3 + 0.2x",
  neither: "y = 0.12(x - 1)^2 - 3",
};
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const clampX = (value: number): number => clamp(value, xControl.min, xControl.max);
const snapXToControl = (value: number): number => {
  const clamped = clampX(value);
  const snapped = xControl.min + Math.round((clamped - xControl.min) / xControl.step) * xControl.step;
  return Number(clampX(snapped).toFixed(2));
};
const isSymmetryType = (value: unknown): value is SymmetryType => functionSymmetryDefinition.parameters.symmetryType.allowedValues.includes(value as SymmetryType);
const normalizeFunctionSymmetryValues = (values: FunctionSymmetryValues) => ({
  symmetryType: isSymmetryType(values.symmetryType) ? values.symmetryType : functionSymmetryDefinition.parameters.symmetryType.defaultValue,
  x: clampX(Number.isFinite(values.x) ? values.x as number : xControl.defaultValue),
});
const evaluateSymmetryFunction = (symmetryType: SymmetryType, x: number): number => symmetryType === "even"
  ? 0.2 * x * x - 2
  : symmetryType === "odd" ? 0.025 * x * x * x + 0.2 * x : 0.12 * (x - 1) * (x - 1) - 3;

function deriveFunctionSymmetryPoints(values: FunctionSymmetryValues) {
  const normalized = normalizeFunctionSymmetryValues(values);
  const y = evaluateSymmetryFunction(normalized.symmetryType, normalized.x);
  return {
    point: { x: normalized.x, y },
    evenCandidate: { x: -normalized.x, y },
    oddCandidate: { x: -normalized.x, y: -y },
    actualOppositeX: { x: -normalized.x, y: evaluateSymmetryFunction(normalized.symmetryType, -normalized.x) },
  };
}
const symmetryTypeToIndex = (symmetryType: SymmetryType): number => symmetryOptions.find((option) => option.symmetryType === symmetryType)?.value ?? 0;

function initializeFunctionSymmetrySchema(): void {}
function initializeFunctionSymmetryModel(): void {}

export {
  initializeFunctionSymmetryModel as a,
  initializeFunctionSymmetrySchema as c,
  symmetryTypeToIndex as i,
  functionSymmetryDefinition as l,
  symmetryOptions as n,
  normalizeFunctionSymmetryValues as o,
  deriveFunctionSymmetryPoints as r,
  snapXToControl as s,
  symmetryFormulas as t,
};
