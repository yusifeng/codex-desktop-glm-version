// Mixed-number learning model: divide a numerator into sixths.
import "@rchunk/rolldown-runtime";

interface IntegerParameter {
  defaultValue: number;
  kind: "integer";
  max: number;
  min: number;
}

interface MixedNumberValues { numerator?: number | null }

const mixedNumbersType = "MIXED_NUMBERS";
const mixedNumbersThumbnailAssetKey = "mixed-numbers-v1";
const mixedNumbersParameters: { numerator: IntegerParameter } = {
  numerator: { kind: "integer", defaultValue: 23, min: 7, max: 35 },
};
const mixedNumbersSpecification = {
  type: mixedNumbersType,
  version: 2,
  thumbnailAssetKey: mixedNumbersThumbnailAssetKey,
  parameters: mixedNumbersParameters,
};
const numeratorParameter = mixedNumbersSpecification.parameters.numerator;
const numeratorControl = {
  baseMin: numeratorParameter.min,
  baseMax: numeratorParameter.max,
  step: 1,
};

function normalizeNumerator(value: number | null | undefined): number {
  const fallback = numeratorParameter.defaultValue;
  return Math.min(
    numeratorParameter.max,
    Math.max(numeratorParameter.min, Math.round(Number.isFinite(value) ? value ?? fallback : fallback)),
  );
}

function calculateMixedNumber(values: MixedNumberValues) {
  const numerator = normalizeNumerator(values.numerator);
  const whole = Math.floor(numerator / 6);
  return { denominator: 6, numerator, remainder: numerator % 6, whole };
}

function initializeMixedNumbersSpecification(): void {}
function initializeMixedNumbersModel(): void {}

export {
  initializeMixedNumbersSpecification as a,
  calculateMixedNumber as i,
  numeratorControl as n,
  mixedNumbersSpecification as o,
  initializeMixedNumbersModel as r,
  numeratorParameter as t,
};
