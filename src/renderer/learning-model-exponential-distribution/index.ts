// Exponential-distribution teaching model. Release chunk: model-c7c82547bc35.js.
import "@rchunk/rolldown-runtime";

interface ExponentialDistributionInput { rate?: number; waiting_time?: number }
interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }

const exponentialDistributionDefinition = {
  type: "EXPONENTIAL_DISTRIBUTION",
  version: 2,
  thumbnailAssetKey: "exponential-distribution-v2",
  canonicalFormula: "f(t)=\\lambda e^{-\\lambda t},\\quad t\\ge 0",
  parameters: {
    rate: { kind: "number", defaultValue: 0.5, min: 0.25, max: 1 },
    waiting_time: { kind: "number", defaultValue: 5, min: 0, max: 12 },
  },
} as const;
const rateControl = exponentialDistributionDefinition.parameters.rate;
const waitingTimeControl = exponentialDistributionDefinition.parameters.waiting_time;
const densityFloor = 0.01;
const samplingStep = 0.1;
const maximumPlotTime = waitingTimeControl.max + 2 / rateControl.min;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeParameter = (value: number | undefined, parameter: NumberParameter): number =>
  typeof value === "number" && Number.isFinite(value) ? clamp(value, parameter.min, parameter.max) : parameter.defaultValue;
const normalizeExponentialDistributionInput = (input: ExponentialDistributionInput) => ({
  rate: normalizeParameter(input.rate, rateControl),
  waiting_time: normalizeParameter(input.waiting_time, waitingTimeControl),
});
const exponentialDensity = (rate: number, waitingTime: number): number => rate * Math.exp(-rate * waitingTime);
const calculateExponentialDistribution = (input: ExponentialDistributionInput) => {
  const normalized = normalizeExponentialDistributionInput(input);
  return {
    ...normalized,
    densityAtThreshold: exponentialDensity(normalized.rate, normalized.waiting_time),
    meanWaitingTime: 1 / normalized.rate,
    survivalProbability: Math.exp(-normalized.rate * normalized.waiting_time),
  };
};
function initializeExponentialDistributionDefinition(): void {}
function initializeExponentialDistributionModel(): void {}

export { samplingStep as a, normalizeExponentialDistributionInput as c, waitingTimeControl as i, initializeExponentialDistributionDefinition as l, densityFloor as n, calculateExponentialDistribution as o, maximumPlotTime as r, initializeExponentialDistributionModel as s, rateControl as t, exponentialDistributionDefinition as u };
