// Heteroskedasticity learning model with deterministic residual clouds.
import "@rchunk/rolldown-runtime";

type VariancePattern = "constant" | "increasing" | "decreasing" | "bulge";
interface HeteroskedasticityValues { initial_variance_pattern?: unknown }

const heteroskedasticityType = "HETEROSKEDASTICITY";
const heteroskedasticityThumbnail = "heteroskedasticity-v1";
const heteroskedasticityParameters = { initial_variance_pattern: { kind: "enum", defaultValue: "constant" as VariancePattern, allowedValues: ["constant", "increasing", "decreasing", "bulge"] as VariancePattern[] } };
const heteroskedasticityDefinition = { type: heteroskedasticityType, version: 2, thumbnailAssetKey: heteroskedasticityThumbnail, parameters: heteroskedasticityParameters };
const variancePatterns: VariancePattern[] = ["constant", "increasing", "decreasing", "bulge"];
const defaultVariancePattern = heteroskedasticityDefinition.parameters.initial_variance_pattern.defaultValue;
const isVariancePattern = (value: unknown): value is VariancePattern => variancePatterns.some((pattern) => pattern === value);
const normalizeHeteroskedasticityValues = (values: HeteroskedasticityValues) => ({ initial_variance_pattern: isVariancePattern(values.initial_variance_pattern) ? values.initial_variance_pattern : defaultVariancePattern });
const residualSpread = (pattern: VariancePattern, fittedValue: number): number => {
  const normalized = Math.min(1, Math.max(0, fittedValue / 10));
  switch (pattern) {
    case "increasing": return 0.42 + 1.82 * normalized;
    case "decreasing": return 2.24 - 1.82 * normalized;
    case "bulge": return 0.42 + 1.82 * Math.sin(Math.PI * normalized);
    case "constant": return 1.3;
  }
};
const fittedGroupCount = 18;
const deterministicFraction = (group: number, sample: number, seed: number): number => {
  const value = Math.sin((group + 1) * 127.1 + (sample + 1) * 311.7 + seed);
  return value - Math.floor(value);
};
const buildResidualCloud = (pattern: VariancePattern) => Array.from({ length: fittedGroupCount }, (_unused, group) => {
  const fittedValue = 0.42 + group * 9.16 / 17;
  const spread = residualSpread(pattern, fittedValue);
  const samples = Array.from({ length: 4 }, (_unusedSample, sample) => deterministicFraction(group, sample, 19.3));
  const mean = samples.reduce((total, sample) => total + sample, 0) / samples.length;
  const centered = samples.map((sample) => sample - mean);
  const standardDeviation = Math.sqrt(centered.reduce((total, sample) => total + sample ** 2, 0) / centered.length);
  return centered.map((sample) => sample / standardDeviation * 0.76).map((residual, sample) => ({
    x: Number((fittedValue + (deterministicFraction(group, sample, 73.1) - 0.5) * 0.3).toFixed(3)),
    y: residual * spread,
  }));
}).flat();
const buildResidualSpreadGuides = (pattern: VariancePattern) => Array.from({ length: 9 }, (_unused, index) => {
  const fittedValue = 0.5 + index * 9 / 8;
  const spread = residualSpread(pattern, fittedValue) * (0.82 + deterministicFraction(index, 0, 91.7) * 0.16);
  return [
    { x: Number((fittedValue - 0.06).toFixed(3)), y: Number((-spread).toFixed(3)) },
    { x: Number((fittedValue + 0.06).toFixed(3)), y: Number(spread.toFixed(3)) },
  ];
}).flat();

function initializeHeteroskedasticitySchema(): void {}
function initializeHeteroskedasticityModel(): void {}

export {
  initializeHeteroskedasticityModel as a,
  heteroskedasticityDefinition as c,
  buildResidualSpreadGuides as i,
  variancePatterns as n,
  normalizeHeteroskedasticityValues as o,
  buildResidualCloud as r,
  initializeHeteroskedasticitySchema as s,
  defaultVariancePattern as t,
};
