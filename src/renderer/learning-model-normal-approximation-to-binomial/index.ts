// Exact binomial probabilities compared with a continuity-corrected normal approximation.
import "@rchunk/rolldown-runtime";

type BinomialEvent = "at_most" | "at_least" | "exactly";
interface BinomialApproximationValues { trials?: number | null; success_probability?: number | null; success_count?: number | null; event?: unknown }

const normalApproximationSpecification = {
  type: "NORMAL_APPROXIMATION_TO_BINOMIAL", version: 2, thumbnailAssetKey: "normal-approximation-to-binomial-v1",
  parameters: {
    trials: { kind: "integer" as const, defaultValue: 40, min: 10, max: 80 },
    success_probability: { kind: "number" as const, defaultValue: 0.5, min: 0.02, max: 0.98 },
    success_count: { kind: "integer" as const, defaultValue: 20, min: 0, max: 80 },
    event: { kind: "enum" as const, defaultValue: "at_most" as BinomialEvent, allowedValues: ["at_most", "at_least", "exactly"] as BinomialEvent[] },
  },
};
const trialsParameter = normalApproximationSpecification.parameters.trials;
const probabilityParameter = normalApproximationSpecification.parameters.success_probability;
const successCountParameter = normalApproximationSpecification.parameters.success_count;
const eventParameter = normalApproximationSpecification.parameters.event;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const finiteOrDefault = (value: number | null | undefined, defaultValue: number, minimum: number, maximum: number): number => typeof value === "number" && Number.isFinite(value) ? clamp(value, minimum, maximum) : defaultValue;
const normalizeEvent = (value: unknown): BinomialEvent => value === "at_most" || value === "at_least" || value === "exactly" ? value : "at_most";
const normalizeBinomialApproximationValues = (values: BinomialApproximationValues) => ({
  trials: Math.round(finiteOrDefault(values.trials, trialsParameter.defaultValue, trialsParameter.min, trialsParameter.max)),
  success_probability: finiteOrDefault(values.success_probability, probabilityParameter.defaultValue, probabilityParameter.min, probabilityParameter.max),
  success_count: Math.round(finiteOrDefault(values.success_count, successCountParameter.defaultValue, successCountParameter.min, successCountParameter.max)),
  event: normalizeEvent(values.event ?? eventParameter.defaultValue),
});
const standardNormalCdf = (value: number): number => {
  const sign = value < 0 ? -1 : 1;
  const magnitude = Math.abs(value) / Math.SQRT2;
  const scale = 1 / (1 + 0.3275911 * magnitude);
  return 0.5 * (1 + sign * (1 - ((((1.061405429 * scale - 1.453152027) * scale + 1.421413741) * scale - 0.284496736) * scale + 0.254829592) * scale * Math.exp(-magnitude * magnitude)));
};
const normalDensity = (value: number, mean: number, standardDeviation: number): number => Math.exp(-0.5 * ((value - mean) / standardDeviation) ** 2) / (standardDeviation * Math.sqrt(2 * Math.PI));
const calculateNormalApproximation = (values: BinomialApproximationValues) => {
  const normalized = normalizeBinomialApproximationValues(values);
  const { trials, success_probability: probability, success_count: successCount, event } = normalized;
  const failureProbability = 1 - probability;
  const expectedSuccesses = trials * probability;
  const expectedFailures = trials * failureProbability;
  const standardDeviation = Math.sqrt(trials * probability * failureProbability);
  const probabilities = [failureProbability ** trials];
  for (let count = 0; count < trials; count += 1) probabilities.push((probabilities[count] ?? 0) * ((trials - count) / (count + 1)) * (probability / failureProbability));
  const bars = probabilities.map((barProbability, count) => ({ count, probability: barProbability, selected: event === "at_most" ? count <= successCount : event === "at_least" ? count >= successCount : count === successCount }));
  const exactProbability = bars.reduce((sum, bar) => sum + (bar.selected ? bar.probability : 0), 0);
  const lowerBoundary = event === "at_least" || event === "exactly" ? successCount - 0.5 : undefined;
  const upperBoundary = event === "at_most" || event === "exactly" ? successCount + 0.5 : undefined;
  const lowerZ = lowerBoundary === undefined ? -Infinity : (lowerBoundary - expectedSuccesses) / standardDeviation;
  const upperZ = upperBoundary === undefined ? Infinity : (upperBoundary - expectedSuccesses) / standardDeviation;
  const approximateProbability = (Number.isFinite(upperZ) ? standardNormalCdf(upperZ) : 1) - (Number.isFinite(lowerZ) ? standardNormalCdf(lowerZ) : 0);
  return { ...normalized, bars, expectedSuccesses, expectedFailures, standardDeviation, exactProbability: clamp(exactProbability, 0, 1), approximateProbability: clamp(approximateProbability, 0, 1), lowerBoundary, upperBoundary, meetsRuleOfTen: expectedSuccesses >= 10 && expectedFailures >= 10, meetsRuleOfFive: expectedSuccesses >= 5 && expectedFailures >= 5 };
};
const normalCurvePoints = (minimum: number, maximum: number, mean: number, standardDeviation: number) => [
  { x: minimum, y: 0 },
  ...Array.from({ length: 97 }, (_, index) => { const x = minimum + index / 96 * (maximum - minimum); return { x, y: normalDensity(x, mean, standardDeviation) }; }),
  { x: maximum, y: 0 },
];

function initializeNormalApproximationSpecification(): void {}
function initializeNormalApproximationModel(): void {}

export { calculateNormalApproximation as a, normalDensity as c, normalApproximationSpecification as d, trialsParameter as i, normalizeBinomialApproximationValues as l, successCountParameter as n, normalCurvePoints as o, probabilityParameter as r, initializeNormalApproximationModel as s, eventParameter as t, initializeNormalApproximationSpecification as u };
