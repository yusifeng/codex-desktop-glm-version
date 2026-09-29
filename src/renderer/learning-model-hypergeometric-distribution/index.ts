// Hypergeometric-distribution learning model for sampling without replacement.
import "@rchunk/rolldown-runtime";

interface HypergeometricValues { population_size?: number | null; population_successes?: number | null; sample_size?: number | null; selected_successes?: number | null }
interface IntegerControl { defaultValue: number; min: number; max: number; step: number }

const hypergeometricType = "HYPERGEOMETRIC_DISTRIBUTION";
const hypergeometricThumbnail = "hypergeometric-distribution-v1";
const hypergeometricFormula = "P(X=k)=\\frac{\\binom{K}{k}\\binom{N-K}{n-k}}{\\binom{N}{n}}";
const hypergeometricParameters = {
  population_size: { kind: "integer", defaultValue: 12, min: 12, max: 24 },
  population_successes: { kind: "integer", defaultValue: 5, min: 0, max: 12 },
  sample_size: { kind: "integer", defaultValue: 7, min: 1, max: 12 },
};
const hypergeometricDefinition = { type: hypergeometricType, version: 3, thumbnailAssetKey: hypergeometricThumbnail, canonicalFormula: hypergeometricFormula, parameters: hypergeometricParameters };
const parameters = hypergeometricDefinition.parameters;
const populationSizeControl = { ...parameters.population_size, step: 1 };
const populationSuccessesControl = { ...parameters.population_successes, step: 1 };
const sampleSizeControl = { ...parameters.sample_size, step: 1 };
const selectedSuccessesControl = { defaultValue: 3, min: 0, max: populationSizeControl.max, step: 1 };
const modeTolerance = 1e-12;
const normalizeInteger = (value: number | null | undefined, control: IntegerControl): number => Number.isFinite(value) ? Math.min(control.max, Math.max(control.min, Math.round(value ?? control.defaultValue))) : control.defaultValue;
const normalizeHypergeometricValues = (values: HypergeometricValues) => {
  const population_size = normalizeInteger(values.population_size, populationSizeControl);
  return {
    population_size,
    population_successes: normalizeInteger(values.population_successes, { ...populationSuccessesControl, max: population_size }),
    sample_size: normalizeInteger(values.sample_size, { ...sampleSizeControl, max: population_size }),
    selected_successes: normalizeInteger(values.selected_successes, selectedSuccessesControl),
  };
};
const combinations = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  const shorter = Math.min(k, n - k);
  let result = 1;
  for (let index = 1; index <= shorter; index += 1) result = result * (n - shorter + index) / index;
  return result;
};

function deriveHypergeometricDistribution(values: HypergeometricValues) {
  const normalized = normalizeHypergeometricValues(values);
  const populationFailures = normalized.population_size - normalized.population_successes;
  const minimumSuccesses = Math.max(0, normalized.sample_size - populationFailures);
  const maximumSuccesses = Math.min(normalized.sample_size, normalized.population_successes);
  const totalSamples = combinations(normalized.population_size, normalized.sample_size);
  const outcomes = Array.from({ length: maximumSuccesses - minimumSuccesses + 1 }, (_unused, index) => {
    const successes = minimumSuccesses + index;
    const probability = combinations(normalized.population_successes, successes) * combinations(populationFailures, normalized.sample_size - successes) / totalSamples;
    return { successes, probability, probabilityPercent: probability * 100 };
  });
  const firstOutcome = outcomes[0];
  if (!firstOutcome) throw Error("Hypergeometric distribution must have a feasible outcome.");
  const maximumProbability = outcomes.reduce((maximum, outcome) => Math.max(maximum, outcome.probability), firstOutcome.probability);
  const modes = outcomes.filter((outcome) => Math.abs(outcome.probability - maximumProbability) <= modeTolerance);
  const selected_successes = Math.min(maximumSuccesses, Math.max(minimumSuccesses, normalized.selected_successes));
  const selectedOutcome = outcomes[selected_successes - minimumSuccesses];
  if (!selectedOutcome) throw Error("Selected hypergeometric outcome must be feasible.");
  return { ...normalized, selected_successes, populationFailures, minimumSuccesses, maximumSuccesses, totalSamples, expectedSuccesses: normalized.sample_size * normalized.population_successes / normalized.population_size, outcomes, modes, selectedOutcome };
}

function initializeHypergeometricSchema(): void {}
function initializeHypergeometricModel(): void {}

export {
  deriveHypergeometricDistribution as a,
  hypergeometricDefinition as c,
  selectedSuccessesControl as i,
  populationSuccessesControl as n,
  initializeHypergeometricModel as o,
  sampleSizeControl as r,
  initializeHypergeometricSchema as s,
  populationSizeControl as t,
};
