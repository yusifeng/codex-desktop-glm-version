// Binomial outcome probabilities and modes for repeated Bernoulli trials.
import "@rchunk/rolldown-runtime";

interface NumberParameter { kind: "number" | "integer"; defaultValue: number; min: number; max: number }
interface BinomialValues { trials?: number | null; successPercent?: number | null }

const binomialDistributionType = "BINOMIAL_DISTRIBUTION";
const binomialDistributionThumbnail = "binomial-distribution-v1";
const binomialDistributionParameters: { trials: NumberParameter; successPercent: NumberParameter } = {
  trials: { kind: "integer", defaultValue: 6, min: 1, max: 10 },
  successPercent: { kind: "number", defaultValue: 50, min: 0, max: 100 },
};
const binomialDistributionSpecification = { type: binomialDistributionType, version: 3, thumbnailAssetKey: binomialDistributionThumbnail, parameters: binomialDistributionParameters };
const trialsParameter = binomialDistributionSpecification.parameters.trials;
const successPercentParameter = binomialDistributionSpecification.parameters.successPercent;
const trialsControl = { min: trialsParameter.min, max: trialsParameter.max, step: 1, defaultValue: trialsParameter.defaultValue };
const successPercentControl = { min: successPercentParameter.min, max: successPercentParameter.max, step: 5, defaultValue: successPercentParameter.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const modeTolerance = 1e-12;
const normalizeNumber = (value: number | null | undefined, defaultValue: number, minimum: number, maximum: number): number => Number.isFinite(value) ? clamp(value ?? defaultValue, minimum, maximum) : defaultValue;
const normalizeBinomialValues = (values: BinomialValues) => ({
  trials: Math.round(normalizeNumber(values.trials, trialsControl.defaultValue, trialsControl.min, trialsControl.max)),
  successPercent: normalizeNumber(values.successPercent, successPercentControl.defaultValue, successPercentControl.min, successPercentControl.max),
});
const binomialCoefficient = (trials: number, successes: number): number => {
  const terms = Math.min(successes, trials - successes);
  let coefficient = 1;
  for (let term = 1; term <= terms; term += 1) coefficient = coefficient * (trials - terms + term) / term;
  return coefficient;
};
const calculateBinomialDistribution = (values: BinomialValues) => {
  const normalized = normalizeBinomialValues(values);
  const successProbability = normalized.successPercent / 100;
  const failureProbability = 1 - successProbability;
  const outcomes = Array.from({ length: normalized.trials + 1 }, (_unused, successes) => {
    const probability = binomialCoefficient(normalized.trials, successes) * successProbability ** successes * failureProbability ** (normalized.trials - successes);
    return { successes, probability, probabilityPercent: probability * 100 };
  });
  const firstOutcome = outcomes[0];
  if (!firstOutcome) throw Error("Binomial distribution must contain at least one outcome.");
  const maximumProbability = outcomes.reduce((maximum, outcome) => Math.max(maximum, outcome.probability), firstOutcome.probability);
  const [firstMode, ...remainingModes] = outcomes.filter((outcome) => Math.abs(outcome.probability - maximumProbability) <= modeTolerance);
  if (!firstMode) throw Error("Binomial distribution must contain at least one mode.");
  return { ...normalized, successProbability, outcomes, mostLikelyOutcomes: [firstMode, ...remainingModes] };
};

function initializeBinomialDistributionSpecification(): void {}
function initializeBinomialDistributionModel(): void {}

export { normalizeBinomialValues as a, initializeBinomialDistributionModel as i, trialsControl as n, initializeBinomialDistributionSpecification as o, calculateBinomialDistribution as r, binomialDistributionSpecification as s, successPercentControl as t };
