// Regression confidence-band versus prediction-band learning model.
import "@rchunk/rolldown-runtime";

type ConfidenceLevel = "90%" | "95%" | "99%";
type SampleSize = 12 | 30 | 100;
interface BandValues { confidence_level?: unknown; selectedX?: number | null; sampleSize?: number | null }

const confidenceBandsType = "CONFIDENCE_VS_PREDICTION_BANDS";
const confidenceBandsThumbnail = "confidence-vs-prediction-bands-v1";
const confidenceBandsParameters = { confidence_level: { kind: "enum", defaultValue: "95%" as ConfidenceLevel, allowedValues: ["90%", "95%", "99%"] as ConfidenceLevel[] } };
const confidenceBandsDefinition = { type: confidenceBandsType, version: 3, thumbnailAssetKey: confidenceBandsThumbnail, parameters: confidenceBandsParameters };
const sampleSizes: SampleSize[] = [12, 30, 100];
const confidenceLevelParameter = confidenceBandsDefinition.parameters.confidence_level;
const regressionViewport = { xMin: -0.4, xMax: 10.4, yMin: -1.2, yMax: 11.2 };
const isConfidenceLevel = (value: unknown): value is ConfidenceLevel => typeof value === "string" && confidenceLevelParameter.allowedValues.some((level) => level === value);
const defaultConfidenceLevel = isConfidenceLevel(confidenceLevelParameter.defaultValue) ? confidenceLevelParameter.defaultValue : "95%";
const criticalValues: Record<SampleSize, Record<ConfidenceLevel, number>> = {
  12: { "90%": 1.812, "95%": 2.228, "99%": 3.169 }, 30: { "90%": 1.701, "95%": 2.048, "99%": 2.763 }, 100: { "90%": 1.66, "95%": 1.984, "99%": 2.626 },
};
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const isSampleSize = (value: unknown): value is SampleSize => typeof value === "number" && sampleSizes.some((size) => size === value);
const normalizeBandValues = (values: BandValues) => ({
  confidence_level: isConfidenceLevel(values.confidence_level) ? values.confidence_level : defaultConfidenceLevel,
  selectedX: Number.isFinite(values.selectedX) ? clamp(values.selectedX ?? 5, 0, 10) : 5,
  sampleSize: isSampleSize(values.sampleSize) ? values.sampleSize : 30,
});

function deriveConfidenceAndPredictionBands(values: BandValues) {
  const normalized = normalizeBandValues(values);
  const xValues = Array.from({ length: normalized.sampleSize }, (_unused, index) => 10 * index / (normalized.sampleSize - 1));
  const centeredSumSquares = xValues.reduce((sum, x) => sum + (x - 5) ** 2, 0);
  const deterministicNoise = xValues.map((_x, index) => Math.sin((index + 1) * 2.3999632297) + 0.42 * Math.cos((index + 1) * 1.713));
  const meanNoise = deterministicNoise.reduce((sum, noise) => sum + noise, 0) / normalized.sampleSize;
  const noiseSlope = deterministicNoise.reduce((sum, noise, index) => sum + (xValues[index] - 5) * (noise - meanNoise), 0) / centeredSumSquares;
  const residuals = deterministicNoise.map((noise, index) => noise - meanNoise - noiseSlope * (xValues[index] - 5));
  const residualStandardDeviation = Math.sqrt(residuals.reduce((sum, residual) => sum + residual ** 2, 0) / (normalized.sampleSize - 2));
  const residualScale = 0.78;
  const scaleMultiplier = residualScale / residualStandardDeviation;
  const fittedValue = (x: number): number => 2.15 + 0.57 * x;
  const observed = xValues.map((x, index) => ({ x, y: fittedValue(x) + residuals[index] * scaleMultiplier }));
  const criticalValue = criticalValues[normalized.sampleSize][normalized.confidence_level];
  const halfWidths = (x: number) => {
    const leverage = 1 / normalized.sampleSize + (x - 5) ** 2 / centeredSumSquares;
    return { confidence: criticalValue * residualScale * Math.sqrt(leverage), prediction: criticalValue * residualScale * Math.sqrt(1 + leverage) };
  };
  const plotX = Array.from({ length: 81 }, (_unused, index) => index / 8);
  const confidenceUpper = plotX.map((x) => ({ x, y: fittedValue(x) + halfWidths(x).confidence }));
  const confidenceLower = plotX.map((x) => ({ x, y: fittedValue(x) - halfWidths(x).confidence }));
  const predictionUpper = plotX.map((x) => ({ x, y: fittedValue(x) + halfWidths(x).prediction }));
  const predictionLower = plotX.map((x) => ({ x, y: fittedValue(x) - halfWidths(x).prediction }));
  const selectedWidths = halfWidths(normalized.selectedX);
  const fittedAtX = fittedValue(normalized.selectedX);
  return { confidenceLevel: normalized.confidence_level, sampleSize: normalized.sampleSize, selectedX: normalized.selectedX, observed, fitted: [{ x: 0, y: fittedValue(0) }, { x: 10, y: fittedValue(10) }], confidenceUpper, confidenceLower, predictionUpper, predictionLower, fittedAtX, confidenceHalfWidth: selectedWidths.confidence, predictionHalfWidth: selectedWidths.prediction, newResponse: { x: normalized.selectedX, y: fittedAtX + 0.72 * residualScale }, residualScale };
}

function initializeConfidenceBandsSchema(): void {}
function initializeConfidenceBandsModel(): void {}

export {
  normalizeBandValues as a,
  initializeConfidenceBandsModel as i,
  regressionViewport as n,
  initializeConfidenceBandsSchema as o,
  deriveConfidenceAndPredictionBands as r,
  confidenceBandsDefinition as s,
  defaultConfidenceLevel as t,
};
