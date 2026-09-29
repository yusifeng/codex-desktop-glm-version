// Z-score and p-value learning model. Release chunk: model-adbf96dad63f.js.
import "@rchunk/rolldown-runtime";

type TestType = "one-sided" | "two-sided";
interface ZScoreValues { zScore?: number | null; testType?: string | null }
interface ZScoreManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    zScore: { kind: "number"; defaultValue: number; min: number; max: number; multipleOf: number };
    testType: { kind: "enum"; defaultValue: TestType; allowedValues: TestType[] };
  };
}

let zScoreManifest: ZScoreManifest;
let oneSidedTest: TestType;
let twoSidedTest: TestType;
let zScoreParameter: ZScoreManifest["parameters"]["zScore"];
let defaultTestType: TestType;
let zScoreStep: number;
let normalizeZScoreValues: (values: ZScoreValues) => { zScore: number; testType: TestType };
let calculatePValue: (values: ZScoreValues) => { zScore: number; testType: TestType; magnitude: number; pValue: number };
let standardNormalDensity: (zScore: number) => number;
let densityAreaPolygon: (start: number, end: number) => { x: number; y: number }[];
let manifestInitialized = false;
let modelInitialized = false;

function initializeZScoreManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  zScoreManifest = {
    type: "Z_SCORE_P_VALUE", version: 1, thumbnailAssetKey: "z-score-p-value-v1",
    parameters: {
      zScore: { kind: "number", defaultValue: 1.96, min: -3.5, max: 3.5, multipleOf: 0.01 },
      testType: { kind: "enum", defaultValue: "two-sided", allowedValues: ["one-sided", "two-sided"] },
    },
  };
}

function initializeZScorePValueModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeZScoreManifest();
  oneSidedTest = "one-sided";
  twoSidedTest = "two-sided";
  zScoreParameter = zScoreManifest.parameters.zScore;
  zScoreStep = zScoreParameter.multipleOf;
  defaultTestType = zScoreManifest.parameters.testType.defaultValue;
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  const roundToStep = (value: number): number => Number((Math.round(value / zScoreParameter.multipleOf) * zScoreParameter.multipleOf).toFixed(2));
  normalizeZScoreValues = values => ({
    zScore: typeof values.zScore === "number" && Number.isFinite(values.zScore)
      ? roundToStep(clamp(values.zScore, zScoreParameter.min, zScoreParameter.max))
      : zScoreParameter.defaultValue,
    testType: values.testType === oneSidedTest || values.testType === twoSidedTest ? values.testType : defaultTestType,
  });
  const complementaryErrorFunction = (value: number): number => {
    const magnitude = Math.abs(value);
    const reciprocal = 1 / (1 + 0.5 * magnitude);
    let polynomial = 0.17087277;
    polynomial = -0.82215223 + reciprocal * polynomial;
    polynomial = 1.48851587 + reciprocal * polynomial;
    polynomial = -1.13520398 + reciprocal * polynomial;
    polynomial = 0.27886807 + reciprocal * polynomial;
    polynomial = -0.18628806 + reciprocal * polynomial;
    polynomial = 0.09678418 + reciprocal * polynomial;
    polynomial = 0.37409196 + reciprocal * polynomial;
    polynomial = 1.00002368 + reciprocal * polynomial;
    const approximation = reciprocal * Math.exp(-magnitude * magnitude - 1.26551223 + reciprocal * polynomial);
    return value >= 0 ? approximation : 2 - approximation;
  };
  const upperTailProbability = (zScore: number): number => {
    const magnitude = Math.max(0, Math.abs(zScore));
    return magnitude === 0 ? 0.5 : 0.5 * complementaryErrorFunction(magnitude / Math.SQRT2);
  };
  calculatePValue = values => {
    const normalized = normalizeZScoreValues(values);
    const magnitude = Math.abs(normalized.zScore);
    const oneTail = upperTailProbability(magnitude);
    const pValue = normalized.testType === twoSidedTest ? 2 * oneTail : oneTail;
    return { ...normalized, magnitude, pValue: clamp(pValue, 0, 1) };
  };
  standardNormalDensity = zScore => Math.exp(-0.5 * zScore * zScore) / Math.sqrt(2 * Math.PI);
  densityAreaPolygon = (start, end) => [
    { x: start, y: 0 },
    ...Array.from({ length: 49 }, (_unused, index) => {
      const x = start + index / 48 * (end - start);
      return { x, y: standardNormalDensity(x) };
    }),
    { x: end, y: 0 },
  ];
}

export {
  zScoreStep as a, standardNormalDensity as c, initializeZScoreManifest as d, zScoreManifest as f, zScoreParameter as i,
  initializeZScorePValueModel as l, oneSidedTest as n, calculatePValue as o, twoSidedTest as r,
  densityAreaPolygon as s, defaultTestType as t, normalizeZScoreValues as u,
};
