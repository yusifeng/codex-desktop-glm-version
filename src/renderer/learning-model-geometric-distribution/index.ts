// Geometric-distribution learning model. Release chunk: model-17b71618727c.js.
import "@rchunk/rolldown-runtime";

interface GeometricValues { success_probability?: number | null; selected_trial?: number | null }
interface NormalizedGeometricValues { success_probability: number; selected_trial: number }
interface GeometricManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: {
    success_probability: { kind: "number"; defaultValue: number; min: number; max: number };
    selected_trial: { kind: "integer"; defaultValue: number; min: number; max: number };
  };
}

let geometricManifest: GeometricManifest;
let successProbabilityControl: { defaultValue: number; min: number; max: number; step: number };
let selectedTrialControl: { defaultValue: number; min: number; max: number; step: number };
let normalizeGeometricValues: (values: GeometricValues) => NormalizedGeometricValues;
let calculateGeometricDistribution: (values: GeometricValues) => {
  successProbability: number; failureProbability: number; selectedTrial: number; selectedProbability: number;
  expectedTrials: number; outcomes: { trial: number; probability: number }[];
};
let formatDecimal: (value: number, precision?: number) => string;
let formatProbabilityPercent: (value: number) => string;
let formatProbabilityEquation: (value: number) => string;
let manifestInitialized = false;
let modelInitialized = false;

function initializeGeometricManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  geometricManifest = {
    type: "GEOMETRIC_DISTRIBUTION", version: 2, thumbnailAssetKey: "geometric-distribution-v1",
    canonicalFormula: "P(X=k)=p(1-p)^{k-1}",
    parameters: {
      success_probability: { kind: "number", defaultValue: 0.25, min: 0.05, max: 0.8 },
      selected_trial: { kind: "integer", defaultValue: 4, min: 1, max: 16 },
    },
  };
}

function initializeGeometricDistributionModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeGeometricManifest();
  const successParameter = geometricManifest.parameters.success_probability;
  const trialParameter = geometricManifest.parameters.selected_trial;
  successProbabilityControl = { defaultValue: successParameter.defaultValue, min: successParameter.min, max: successParameter.max, step: 0.01 };
  selectedTrialControl = { defaultValue: trialParameter.defaultValue, min: trialParameter.min, max: trialParameter.max, step: 1 };
  const normalizeFinite = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(value, minimum), maximum) : fallback;
  normalizeGeometricValues = values => ({
    success_probability: normalizeFinite(values.success_probability, successProbabilityControl.defaultValue, successProbabilityControl.min, successProbabilityControl.max),
    selected_trial: Math.round(normalizeFinite(values.selected_trial, selectedTrialControl.defaultValue, selectedTrialControl.min, selectedTrialControl.max)),
  });
  calculateGeometricDistribution = values => {
    const normalized = normalizeGeometricValues(values);
    const successProbability = normalized.success_probability;
    const failureProbability = 1 - successProbability;
    const outcomes = Array.from({ length: selectedTrialControl.max }, (_unused, index) => {
      const trial = index + 1;
      return { trial, probability: successProbability * failureProbability ** (trial - 1) };
    });
    return {
      successProbability, failureProbability, selectedTrial: normalized.selected_trial,
      selectedProbability: successProbability * failureProbability ** (normalized.selected_trial - 1),
      expectedTrials: 1 / successProbability, outcomes,
    };
  };
  formatDecimal = (value, precision = 3) => value.toFixed(precision).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  formatProbabilityPercent = value => {
    const percent = value * 100;
    if (percent > 0 && percent < 1e-3) return "<0.001%";
    return `${formatDecimal(percent, percent >= 1 ? 1 : percent >= 0.1 ? 2 : 3)}%`;
  };
  formatProbabilityEquation = value => value > 0 && value < 1e-5 ? "\\lt 0.00001" : `=${formatDecimal(value, 5)}`;
}

export {
  formatProbabilityPercent as a, normalizeGeometricValues as c, formatDecimal as i, initializeGeometricManifest as l,
  successProbabilityControl as n, formatProbabilityEquation as o, calculateGeometricDistribution as r,
  initializeGeometricDistributionModel as s, selectedTrialControl as t, geometricManifest as u,
};
