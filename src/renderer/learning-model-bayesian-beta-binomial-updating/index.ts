// Conjugate Beta prior updating for Bernoulli observations.
import "@rchunk/rolldown-runtime";

interface BayesianValues { prior_alpha?: number | null; prior_beta?: number | null; observed_successes?: number | null; observed_failures?: number | null }
interface NumericControl { defaultValue: number; min: number; max: number }

const bayesianSpecification = {
  type: "BAYESIAN_BETA_BINOMIAL_UPDATING",
  version: 1,
  thumbnailAssetKey: "bayesian-beta-binomial-updating-v1",
  parameters: {
    prior_alpha: { kind: "number" as const, defaultValue: 5, min: 1.5, max: 6 },
    prior_beta: { kind: "number" as const, defaultValue: 5, min: 1.5, max: 6 },
    observed_successes: { kind: "integer" as const, defaultValue: 6, min: 0, max: 12 },
    observed_failures: { kind: "integer" as const, defaultValue: 2, min: 0, max: 12 },
  },
};
const bayesianParameters = bayesianSpecification.parameters;
const priorAlphaControl = { ...bayesianParameters.prior_alpha, step: 0.1 };
const priorBetaControl = { ...bayesianParameters.prior_beta, step: 0.1 };
const observedSuccessesControl = { ...bayesianParameters.observed_successes, step: 1 };
const observedFailuresControl = { ...bayesianParameters.observed_failures, step: 1 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeNumber = (value: number | null | undefined, control: NumericControl, integer = false): number => {
  const finiteValue = typeof value === "number" && Number.isFinite(value) ? value : control.defaultValue;
  return clamp(integer ? Math.round(finiteValue) : finiteValue, control.min, control.max);
};
const normalizeBayesianValues = (values: BayesianValues) => ({
  prior_alpha: normalizeNumber(values.prior_alpha, priorAlphaControl),
  prior_beta: normalizeNumber(values.prior_beta, priorBetaControl),
  observed_successes: normalizeNumber(values.observed_successes, observedSuccessesControl, true),
  observed_failures: normalizeNumber(values.observed_failures, observedFailuresControl, true),
});
const lanczosCoefficients = [0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9984369578019572e-21, 15056327351493116e-23];
const logGamma = (value: number): number => {
  let sum = lanczosCoefficients[0];
  const shifted = value - 1;
  for (let index = 1; index < lanczosCoefficients.length; index += 1) sum += lanczosCoefficients[index] / (shifted + index);
  const scale = shifted + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(scale) - scale + Math.log(sum);
};
const calculateBayesianUpdate = (values: BayesianValues) => {
  const normalized = normalizeBayesianValues(values);
  const posteriorAlpha = normalized.prior_alpha + normalized.observed_successes;
  const posteriorBeta = normalized.prior_beta + normalized.observed_failures;
  const trials = normalized.observed_successes + normalized.observed_failures;
  return { ...normalized, posteriorAlpha, posteriorBeta, priorMean: normalized.prior_alpha / (normalized.prior_alpha + normalized.prior_beta), posteriorMean: posteriorAlpha / (posteriorAlpha + posteriorBeta), observedRate: trials === 0 ? null : normalized.observed_successes / trials, trials };
};
const betaDensityCurve = (alpha: number, beta: number, samples = 240) => {
  const logBeta = logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta);
  return Array.from({ length: samples + 1 }, (_, index) => {
    const x = index / samples;
    return x === 0 || x === 1 ? { x, y: 0 } : { x, y: Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log1p(-x) - logBeta) };
  });
};
const formatBayesianNumber = (value: number): string => value.toFixed(2).replace(/\.?0+$/, "");

function initializeBayesianSpecification(): void {}
function initializeBayesianModel(): void {}

export { calculateBayesianUpdate as a, betaDensityCurve as c, bayesianSpecification as d, priorBetaControl as i, normalizeBayesianValues as l, observedSuccessesControl as n, formatBayesianNumber as o, priorAlphaControl as r, initializeBayesianModel as s, observedFailuresControl as t, initializeBayesianSpecification as u };
