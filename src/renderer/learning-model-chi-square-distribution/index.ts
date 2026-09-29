// Chi-square density and upper-tail probability learning model.
import "@rchunk/rolldown-runtime";

interface ChiSquareValues { degrees_of_freedom?: number | null; observed_value?: number | null }

const chiSquareType = "CHI_SQUARE_DISTRIBUTION";
const chiSquareThumbnail = "chi-square-distribution-v1";
const chiSquareParameters = {
  degrees_of_freedom: { kind: "integer", defaultValue: 5, min: 1, max: 20 },
  observed_value: { kind: "number", defaultValue: 11.1, min: 0, max: 30 },
};
const chiSquareDefinition = { type: chiSquareType, version: 2, thumbnailAssetKey: chiSquareThumbnail, parameters: chiSquareParameters };
const displayedDegreesOfFreedom = [1, 2, 3, 5, 10, 20];
const degreesOfFreedomParameter = chiSquareDefinition.parameters.degrees_of_freedom;
const observedValueParameter = chiSquareDefinition.parameters.observed_value;
const minimumDisplayedDensity = 0.1;
const maximumDisplayedDensity = 0.55;
const horizontalContinuationRatio = 0.01;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeChiSquareValues = (values: ChiSquareValues) => ({
  degrees_of_freedom: Number.isFinite(values.degrees_of_freedom) ? Math.round(clamp(values.degrees_of_freedom ?? degreesOfFreedomParameter.defaultValue, degreesOfFreedomParameter.min, degreesOfFreedomParameter.max)) : degreesOfFreedomParameter.defaultValue,
  observed_value: Number.isFinite(values.observed_value) ? clamp(values.observed_value ?? observedValueParameter.defaultValue, observedValueParameter.min, observedValueParameter.max) : observedValueParameter.defaultValue,
});
const gammaHalfInteger = (degreesOfFreedom: number): number => {
  let result = degreesOfFreedom % 2 === 0 ? 1 : Math.sqrt(Math.PI);
  const start = degreesOfFreedom % 2 === 0 ? 1 : 0.5;
  const target = degreesOfFreedom / 2;
  for (let value = start; value < target; value += 1) result *= value;
  return result;
};
const chiSquareDensity = (x: number, degreesOfFreedom: number): number => {
  if (x < 0) return 0;
  if (x === 0) return degreesOfFreedom === 1 ? Number.POSITIVE_INFINITY : degreesOfFreedom === 2 ? 0.5 : 0;
  const halfDegrees = degreesOfFreedom / 2;
  return x ** (halfDegrees - 1) * Math.exp(-x / 2) / (2 ** halfDegrees * gammaHalfInteger(degreesOfFreedom));
};
const complementaryErrorFunction = (value: number): number => {
  const absolute = Math.abs(value);
  const t = 1 / (1 + 0.5 * absolute);
  let polynomial = 0.17087277;
  polynomial = -0.82215223 + t * polynomial;
  polynomial = 1.48851587 + t * polynomial;
  polynomial = -1.13520398 + t * polynomial;
  polynomial = 0.27886807 + t * polynomial;
  polynomial = -0.18628806 + t * polynomial;
  polynomial = 0.09678418 + t * polynomial;
  polynomial = 0.37409196 + t * polynomial;
  polynomial = 1.00002368 + t * polynomial;
  return t * Math.exp(-absolute * absolute - 1.26551223 + t * polynomial);
};
const upperTailProbability = (x: number, degreesOfFreedom: number): number => {
  if (x <= 0) return 1;
  const halfX = x / 2;
  let shape = degreesOfFreedom % 2 === 0 ? 1 : 0.5;
  let probability = degreesOfFreedom % 2 === 0 ? Math.exp(-halfX) : complementaryErrorFunction(Math.sqrt(halfX));
  while (shape < degreesOfFreedom / 2) {
    probability += Math.exp(-halfX) * halfX ** shape / gammaHalfInteger(2 * (shape + 1));
    shape += 1;
  }
  return clamp(probability, 0, 1);
};
const buildChiSquareCurve = (degreesOfFreedom: number) => Array.from({ length: 241 }, (_unused, index) => {
  const x = index / 240 * 40;
  return { x, y: Math.min(chiSquareDensity(x, degreesOfFreedom), maximumDisplayedDensity) };
});
const buildUpperTailArea = (observedValue: number, degreesOfFreedom: number) => [
  { x: observedValue, y: 0 },
  ...Array.from({ length: 121 }, (_unused, index) => {
    const x = observedValue + index / 120 * (40 - observedValue);
    return { x, y: Math.min(chiSquareDensity(x, degreesOfFreedom), maximumDisplayedDensity) };
  }),
  { x: 40, y: 0 },
];

function deriveChiSquareState(values: ChiSquareValues) {
  const normalized = normalizeChiSquareValues(values);
  const probability = upperTailProbability(normalized.observed_value, normalized.degrees_of_freedom);
  const densityAtObserved = chiSquareDensity(normalized.observed_value, normalized.degrees_of_freedom);
  const tailAtPlotEnd = upperTailProbability(40, normalized.degrees_of_freedom);
  return { ...normalized, upperTailProbability: probability, densityAtObserved, plotContinuation: densityAtObserved > maximumDisplayedDensity ? "above-density-scale" : tailAtPlotEnd > probability * horizontalContinuationRatio ? "beyond-horizontal-axis" : null };
}

function initializeChiSquareSchema(): void {}
function initializeChiSquareModel(): void {}

export {
  maximumDisplayedDensity as a,
  buildUpperTailArea as c,
  initializeChiSquareSchema as d,
  chiSquareDefinition as f,
  minimumDisplayedDensity as i,
  initializeChiSquareModel as l,
  displayedDegreesOfFreedom as n,
  deriveChiSquareState as o,
  observedValueParameter as r,
  buildChiSquareCurve as s,
  degreesOfFreedomParameter as t,
  normalizeChiSquareValues as u,
};
