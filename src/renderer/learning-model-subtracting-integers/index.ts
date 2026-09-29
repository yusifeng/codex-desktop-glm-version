// Integer-subtraction learning model represented as leftward number-line steps.
import "@rchunk/rolldown-runtime";

interface IntegerParameter { kind: "integer"; defaultValue: number; min: number; max: number; step?: number }
interface SubtractionValues { minuend?: number; subtrahend?: number }
interface SubtractionState { minuend: number; subtrahend: number; result: number; stepCount: number; positions: number[]; domainMin: number; domainMax: number }

let subtractingIntegersManifest: { type: string; version: number; thumbnailAssetKey: string; parameters: { minuend: IntegerParameter; subtrahend: IntegerParameter } };
let minuendControl: IntegerParameter;
let subtrahendControl: IntegerParameter;
let normalizeSubtractionValues: (values: SubtractionValues) => { minuend: number; subtrahend: number };
let calculateIntegerSubtraction: (values: SubtractionValues) => SubtractionState;
let manifestInitialized = false;
let modelInitialized = false;

function initializeSubtractingIntegersManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  subtractingIntegersManifest = { type: "SUBTRACTING_INTEGERS", version: 1, thumbnailAssetKey: "subtracting-integers-v1", parameters: { minuend: { kind: "integer", defaultValue: 7, min: 1, max: 12 }, subtrahend: { kind: "integer", defaultValue: 4, min: 1, max: 12 } } };
}

function initializeSubtractingIntegersModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeSubtractingIntegersManifest();
  minuendControl = { ...subtractingIntegersManifest.parameters.minuend, step: 1 };
  subtrahendControl = { ...subtractingIntegersManifest.parameters.subtrahend, step: 1 };
  const normalizeInteger = (value: number | undefined, minimum: number, maximum: number, fallback: number): number => Math.min(maximum, Math.max(minimum, Math.round(Number.isFinite(value) ? value as number : fallback)));
  normalizeSubtractionValues = values => ({
    minuend: normalizeInteger(values.minuend, minuendControl.min, minuendControl.max, minuendControl.defaultValue),
    subtrahend: normalizeInteger(values.subtrahend, subtrahendControl.min, subtrahendControl.max, subtrahendControl.defaultValue),
  });
  calculateIntegerSubtraction = values => {
    const normalized = normalizeSubtractionValues(values);
    const stepCount = normalized.subtrahend;
    return { ...normalized, result: normalized.minuend - normalized.subtrahend, stepCount, positions: Array.from({ length: stepCount + 1 }, (_unused, index) => normalized.minuend - index), domainMin: minuendControl.min - subtrahendControl.max - 1, domainMax: minuendControl.max + 1 };
  };
}

export { calculateIntegerSubtraction as a, normalizeSubtractionValues as i, subtrahendControl as n, initializeSubtractingIntegersManifest as o, initializeSubtractingIntegersModel as r, subtractingIntegersManifest as s, minuendControl as t };
