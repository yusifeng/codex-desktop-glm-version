// Ecological-tolerance curve learning model. Release chunk: model-23fa1b82de8d.js.
import "@rchunk/rolldown-runtime";

type EnvironmentalFactor = "temperature" | "salinity" | "pH" | "dissolved oxygen" | "moisture";
type ToleranceZone = "lower-intolerance" | "lower-stress" | "optimum" | "upper-stress" | "upper-intolerance";
interface ToleranceValues { environmental_factor?: string | null; condition?: number | null }
interface ToleranceManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { environmental_factor: { kind: "enum"; defaultValue: EnvironmentalFactor; allowedValues: EnvironmentalFactor[] } };
}

let ecologicalToleranceManifest: ToleranceManifest;
let conditionControl: { defaultValue: number; min: number; max: number; step: number };
let toleranceZones: { lowerLimit: number; lowerOptimum: number; upperOptimum: number; upperLimit: number };
let toleranceCurve: { x: number; y: number }[];
let calculateToleranceState: (values: ToleranceValues) => {
  environmental_factor: EnvironmentalFactor; condition: number; zone: ToleranceZone; relativeAbundance: number;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeEcologicalToleranceManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  ecologicalToleranceManifest = {
    type: "ECOLOGICAL_TOLERANCE_CURVE", version: 2, thumbnailAssetKey: "ecological-tolerance-curve-v2",
    parameters: {
      environmental_factor: {
        kind: "enum", defaultValue: "temperature",
        allowedValues: ["temperature", "salinity", "pH", "dissolved oxygen", "moisture"],
      },
    },
  };
}

function initializeEcologicalToleranceCurveModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeEcologicalToleranceManifest();
  conditionControl = { defaultValue: 50, min: 0, max: 100, step: 1 };
  toleranceZones = { lowerLimit: 20, lowerOptimum: 35, upperOptimum: 65, upperLimit: 80 };
  const minimumVisibleAbundance = 0.02;
  const factors = ecologicalToleranceManifest.parameters.environmental_factor;
  const isEnvironmentalFactor = (value: unknown): value is EnvironmentalFactor => factors.allowedValues.some(factor => factor === value);
  const relativeAbundanceAt = (condition: number): number => {
    const distance = Math.abs(condition - 50);
    if (distance > 30) return 0;
    const edgeGaussian = Math.exp(-0.5 * (30 / 16) ** 2);
    const normalizedGaussian = (Math.exp(-0.5 * (distance / 16) ** 2) - edgeGaussian) / (1 - edgeGaussian);
    return minimumVisibleAbundance + 0.98 * normalizedGaussian;
  };
  calculateToleranceState = values => {
    const environmentalFactor = isEnvironmentalFactor(values.environmental_factor)
      ? values.environmental_factor
      : factors.defaultValue;
    const condition = typeof values.condition === "number" && Number.isFinite(values.condition)
      ? Math.min(conditionControl.max, Math.max(conditionControl.min, values.condition))
      : conditionControl.defaultValue;
    const zone: ToleranceZone = condition < toleranceZones.lowerLimit ? "lower-intolerance"
      : condition < toleranceZones.lowerOptimum ? "lower-stress"
      : condition <= toleranceZones.upperOptimum ? "optimum"
      : condition <= toleranceZones.upperLimit ? "upper-stress"
      : "upper-intolerance";
    return { environmental_factor: environmentalFactor, condition, zone, relativeAbundance: relativeAbundanceAt(condition) };
  };
  toleranceCurve = Array.from({ length: 161 }, (_unused, index) => {
    const x = conditionControl.min + index / 160 * conditionControl.max;
    return { x, y: relativeAbundanceAt(x) };
  });
}

export {
  initializeEcologicalToleranceCurveModel as a, calculateToleranceState as i, toleranceCurve as n,
  initializeEcologicalToleranceManifest as o, toleranceZones as r, ecologicalToleranceManifest as s, conditionControl as t,
};
