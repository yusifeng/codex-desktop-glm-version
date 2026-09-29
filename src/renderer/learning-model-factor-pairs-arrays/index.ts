// Factor-pairs-as-arrays learning model. Release chunk: model-b7e30c22fb74.js.
import "@rchunk/rolldown-runtime";

interface FactorPairValues { wholeNumber?: number | null; divisor?: number | null }
interface FactorPair { divisor: number; quotient: number }
interface FactorPairsManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { wholeNumber: { kind: "integer"; defaultValue: number; min: number; max: number } };
}

let factorPairsManifest: FactorPairsManifest;
let wholeNumberControl: { min: number; max: number; step: number; defaultValue: number };
let divisorControl: { min: number; max: number; step: number; defaultValue: number };
let defaultFactorPairValues: { wholeNumber: number; divisor: number };
let normalizeFactorPairValues: (values: FactorPairValues) => { wholeNumber: number; divisor: number };
let calculateFactorPairArray: (values: FactorPairValues) => {
  wholeNumber: number; divisor: number; quotient: number; rows: number; columns: number;
  factorPairs: FactorPair[]; isPrime: boolean; isPerfectSquare: boolean;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeFactorPairsManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  factorPairsManifest = {
    type: "FACTOR_PAIRS_ARRAYS", version: 1, thumbnailAssetKey: "factor-pairs-arrays-v1",
    parameters: { wholeNumber: { kind: "integer", defaultValue: 24, min: 1, max: 36 } },
  };
}

function initializeFactorPairsArraysModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeFactorPairsManifest();
  const parameters = factorPairsManifest.parameters;
  const defaultDivisor = 4;
  wholeNumberControl = {
    min: parameters.wholeNumber.min, max: parameters.wholeNumber.max, step: 1, defaultValue: parameters.wholeNumber.defaultValue,
  };
  divisorControl = { min: 1, max: parameters.wholeNumber.max, step: 1, defaultValue: defaultDivisor };
  defaultFactorPairValues = { wholeNumber: parameters.wholeNumber.defaultValue, divisor: defaultDivisor };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  const finiteInteger = (value: number | null | undefined, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  const factorPairsFor = (wholeNumber: number): FactorPair[] => {
    const pairs: FactorPair[] = [];
    for (let divisor = 1; divisor <= Math.sqrt(wholeNumber); divisor += 1) {
      if (wholeNumber % divisor === 0) pairs.push({ divisor, quotient: wholeNumber / divisor });
    }
    return pairs;
  };
  const nearestDivisor = (candidate: number, pairs: FactorPair[]): number =>
    pairs.reduce((nearest, pair) =>
      Math.abs(pair.divisor - candidate) < Math.abs(nearest.divisor - candidate) ? pair : nearest).divisor;
  normalizeFactorPairValues = values => {
    const wholeNumber = clamp(
      finiteInteger(values.wholeNumber, defaultFactorPairValues.wholeNumber), wholeNumberControl.min, wholeNumberControl.max,
    );
    const factorPairs = factorPairsFor(wholeNumber);
    const requestedDivisor = finiteInteger(values.divisor, defaultFactorPairValues.divisor);
    return { wholeNumber, divisor: nearestDivisor(requestedDivisor, factorPairs) };
  };
  calculateFactorPairArray = values => {
    const normalized = normalizeFactorPairValues(values);
    const factorPairs = factorPairsFor(normalized.wholeNumber);
    const quotient = normalized.wholeNumber / normalized.divisor;
    return {
      ...normalized, quotient, rows: normalized.divisor, columns: quotient, factorPairs,
      isPrime: normalized.wholeNumber > 1 && factorPairs.length === 1 && factorPairs[0].divisor === 1,
      isPerfectSquare: normalized.divisor === quotient,
    };
  };
}

export {
  initializeFactorPairsArraysModel as a, factorPairsManifest as c, calculateFactorPairArray as i,
  divisorControl as n, normalizeFactorPairValues as o, wholeNumberControl as r,
  initializeFactorPairsManifest as s, defaultFactorPairValues as t,
};
