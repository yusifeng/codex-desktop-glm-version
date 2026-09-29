// Simple-division teaching model. Release chunk: model-1b1a0d17905e.js.
import "@rchunk/rolldown-runtime";

interface DivisionInput { dividend?: number; divisor?: number }
interface IntegerParameter { kind: "integer"; defaultValue: number; min: number; max: number }

const modelType = "SIMPLE_DIVISION";
const thumbnailAssetKey = "simple-division-v1";
const divisionParameters: Record<"dividend" | "divisor", IntegerParameter> = {
  dividend: { kind: "integer", defaultValue: 14, min: 1, max: 30 },
  divisor: { kind: "integer", defaultValue: 4, min: 1, max: 10 },
};
const divisionModelMetadata = { type: modelType, version: 2, thumbnailAssetKey, parameters: divisionParameters };
const dividendControl = { ...divisionModelMetadata.parameters.dividend, step: 1 };
const divisorControl = { ...divisionModelMetadata.parameters.divisor, step: 1 };
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);
const normalizeInteger = (value: number | undefined, control: IntegerParameter): number => {
  const finiteValue = typeof value === "number" && Number.isFinite(value) ? value : control.defaultValue;
  return clamp(Math.round(finiteValue), control.min, control.max);
};
const normalizeDivisionInput = (input: DivisionInput) => ({
  dividend: normalizeInteger(input.dividend, dividendControl),
  divisor: normalizeInteger(input.divisor, divisorControl),
});
const calculateSimpleDivision = (input: DivisionInput) => {
  const { dividend, divisor } = normalizeDivisionInput(input);
  const fullGroups = Math.floor(dividend / divisor);
  const remainder = dividend % divisor;
  return { dividend, divisor, fullGroups, groupedCount: fullGroups * divisor, remainder };
};
function initializeDivisionMetadata(): void {}
function initializeSimpleDivisionModel(): void {}

export { normalizeDivisionInput as a, initializeSimpleDivisionModel as i, divisorControl as n, initializeDivisionMetadata as o, calculateSimpleDivision as r, divisionModelMetadata as s, dividendControl as t };
