// Integer-addition number-line model. Release chunk: model-1ff2e69cbdc9.js.
import "@rchunk/rolldown-runtime";

interface AddingIntegersInput { firstAddend?: number; secondAddend?: number }

const addingIntegersDefinition = {
  type: "ADDING_INTEGERS",
  version: 1,
  thumbnailAssetKey: "adding-integers-v1",
  parameters: {
    firstAddend: { kind: "integer", defaultValue: 3, min: 1, max: 12 },
    secondAddend: { kind: "integer", defaultValue: 6, min: 1, max: 12 },
  },
} as const;
const firstAddendControl = { defaultValue: addingIntegersDefinition.parameters.firstAddend.defaultValue, min: addingIntegersDefinition.parameters.firstAddend.min, max: addingIntegersDefinition.parameters.firstAddend.max, step: 1 };
const secondAddendControl = { defaultValue: addingIntegersDefinition.parameters.secondAddend.defaultValue, min: addingIntegersDefinition.parameters.secondAddend.min, max: addingIntegersDefinition.parameters.secondAddend.max, step: 1 };
const numberLineLength = firstAddendControl.max + secondAddendControl.max + 1;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeInteger = (value: number | undefined, fallback: number, minimum: number, maximum: number): number => typeof value === "number" && Number.isFinite(value) ? clamp(Math.round(value), minimum, maximum) : fallback;
const normalizeAddingIntegersInput = (input: AddingIntegersInput) => ({
  firstAddend: normalizeInteger(input.firstAddend, firstAddendControl.defaultValue, firstAddendControl.min, firstAddendControl.max),
  secondAddend: normalizeInteger(input.secondAddend, secondAddendControl.defaultValue, secondAddendControl.min, secondAddendControl.max),
});
const calculateIntegerAddition = (input: AddingIntegersInput) => {
  const normalized = normalizeAddingIntegersInput(input);
  return { ...normalized, sum: normalized.firstAddend + normalized.secondAddend, positions: Array.from({ length: normalized.secondAddend + 1 }, (_unused, index) => normalized.firstAddend + index) };
};
function initializeAddingIntegersDefinition(): void {}
function initializeAddingIntegersModel(): void {}

export { initializeAddingIntegersModel as a, addingIntegersDefinition as c, calculateIntegerAddition as i, numberLineLength as n, normalizeAddingIntegersInput as o, secondAddendControl as r, initializeAddingIntegersDefinition as s, firstAddendControl as t };
