// Split-normal distributions for visualizing left and right skew.
import "@rchunk/rolldown-runtime";

type SkewDirection = "left" | "right";
interface SkewnessValues { direction?: unknown; skewStrength?: number | null }

const skewnessSpecification = {
  type: "SKEWNESS_DIRECTION",
  version: 1,
  thumbnailAssetKey: "skewness-direction-v1",
  parameters: {
    direction: { kind: "enum" as const, defaultValue: "right" as SkewDirection, allowedValues: ["left", "right"] as SkewDirection[] },
    skewStrength: { kind: "number" as const, defaultValue: 0.6, min: 0, max: 1 },
  },
};
const leftDirection = "left";
const rightDirection = "right";
const strengthParameter = skewnessSpecification.parameters.skewStrength;
const defaultDirection = skewnessSpecification.parameters.direction.defaultValue;
const skewStrengthControl = { min: strengthParameter.min, max: strengthParameter.max, step: 0.01, defaultValue: strengthParameter.defaultValue };
const skewnessDomain = { min: -7.5, max: 7.5 };
const curveSegments = 160;
const squareRootTwo = Math.sqrt(2);
const normalScale = Math.sqrt(2 / Math.PI);
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeSkewnessValues = (values: SkewnessValues) => ({
  direction: values.direction === leftDirection || values.direction === rightDirection ? values.direction : defaultDirection,
  skewStrength: typeof values.skewStrength === "number" && Number.isFinite(values.skewStrength) ? clamp(values.skewStrength, skewStrengthControl.min, skewStrengthControl.max) : skewStrengthControl.defaultValue,
});
const errorFunction = (value: number): number => {
  const sign = value < 0 ? -1 : 1;
  const magnitude = Math.abs(value);
  const scale = 1 / (1 + 0.3275911 * magnitude);
  return sign * (1 - ((((1.061405429 * scale - 1.453152027) * scale + 1.421413741) * scale - 0.284496736) * scale + 0.254829592) * scale * Math.exp(-magnitude * magnitude));
};
const normalCdf = (value: number): number => 0.5 * (1 + errorFunction(value / squareRootTwo));
const splitNormalDensity = (value: number, sigmaLeft: number, sigmaRight: number): number => {
  const sigma = value < 0 ? sigmaLeft : sigmaRight;
  return normalScale / (sigmaLeft + sigmaRight) * Math.exp(-(value * value) / (2 * sigma * sigma));
};
const splitNormalCdf = (value: number, sigmaLeft: number, sigmaRight: number): number => {
  const sigmaTotal = sigmaLeft + sigmaRight;
  return value <= 0 ? 2 * sigmaLeft * normalCdf(value / sigmaLeft) / sigmaTotal : sigmaLeft / sigmaTotal + 2 * sigmaRight * (normalCdf(value / sigmaRight) - 0.5) / sigmaTotal;
};
const splitNormalMedian = (sigmaLeft: number, sigmaRight: number): number => {
  let lower = skewnessDomain.min;
  let upper = skewnessDomain.max;
  for (let iteration = 0; iteration < 64; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    if (splitNormalCdf(midpoint, sigmaLeft, sigmaRight) < 0.5) lower = midpoint; else upper = midpoint;
  }
  return (lower + upper) / 2;
};
const sigmasForSkew = (direction: SkewDirection, strength: number) => {
  const narrowSigma = 1 - 0.25 * strength;
  const broadSigma = 1 + 1.6 * strength;
  return direction === rightDirection ? { sigmaLeft: narrowSigma, sigmaRight: broadSigma } : { sigmaLeft: broadSigma, sigmaRight: narrowSigma };
};
const densityPoints = (sigmaLeft: number, sigmaRight: number) => Array.from({ length: curveSegments + 1 }, (_, index) => {
  const x = skewnessDomain.min + index / curveSegments * (skewnessDomain.max - skewnessDomain.min);
  return { x, density: splitNormalDensity(x, sigmaLeft, sigmaRight) };
});
const calculateSkewness = (values: SkewnessValues) => {
  const normalized = normalizeSkewnessValues(values);
  const { sigmaLeft, sigmaRight } = sigmasForSkew(normalized.direction, normalized.skewStrength);
  return { ...normalized, isSymmetric: normalized.skewStrength === 0, sigmaLeft, sigmaRight, mean: normalScale * (sigmaRight - sigmaLeft), median: splitNormalMedian(sigmaLeft, sigmaRight), mode: 0, points: densityPoints(sigmaLeft, sigmaRight) };
};

function initializeSkewnessSpecification(): void {}
function initializeSkewnessModel(): void {}

export { skewStrengthControl as a, normalizeSkewnessValues as c, skewnessSpecification as d, rightDirection as i, splitNormalDensity as l, skewnessDomain as n, calculateSkewness as o, leftDirection as r, initializeSkewnessModel as s, defaultDirection as t, initializeSkewnessSpecification as u };
