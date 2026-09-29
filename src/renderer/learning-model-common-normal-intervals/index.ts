// Common-normal-interval learning model using the standard normal CDF.
import "@rchunk/rolldown-runtime";

interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }

let commonNormalIntervalsManifest: { type: string; version: number; thumbnailAssetKey: string; parameters: { z: NumberParameter } };
let zParameter: NumberParameter;
let zControl: { baseMin: number; baseMax: number; step: number };
let centralNormalProbability: (z: number | null | undefined) => number;
let probabilityPrecision: (probability: number) => number;
let manifestInitialized = false;
let modelInitialized = false;

function initializeCommonNormalIntervalsManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  commonNormalIntervalsManifest = { type: "COMMON_NORMAL_INTERVALS", version: 2, thumbnailAssetKey: "common-normal-intervals-v1", parameters: { z: { kind: "number", defaultValue: 1, min: 0, max: 4 } } };
}

function initializeCommonNormalIntervalsModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeCommonNormalIntervalsManifest();
  zParameter = commonNormalIntervalsManifest.parameters.z;
  zControl = { baseMin: zParameter.min, baseMax: zParameter.max, step: 0.1 };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
  const normalizeZ = (value: number | null | undefined): number => clamp(Number.isFinite(value) ? value ?? zParameter.defaultValue : zParameter.defaultValue, zParameter.min, zParameter.max);
  const errorFunction = (value: number): number => {
    if (value === 0) return 0;
    const sign = value < 0 ? -1 : 1;
    const magnitude = Math.abs(value);
    const factor = 1 / (1 + 0.3275911 * magnitude);
    return sign * (1 - ((((1.061405429 * factor - 1.453152027) * factor + 1.421413741) * factor - 0.284496736) * factor + 0.254829592) * factor * Math.exp(-magnitude * magnitude));
  };
  const normalCdf = (value: number): number => 0.5 * (1 + errorFunction(value / Math.sqrt(2)));
  centralNormalProbability = value => clamp(2 * normalCdf(normalizeZ(value)) - 1, 0, 1);
  probabilityPrecision = probability => {
    const percent = clamp(probability, 0, 1) * 100;
    return percent === 0 ? 0 : percent >= 99.95 && percent < 100 ? 2 : 1;
  };
}

export { initializeCommonNormalIntervalsModel as a, probabilityPrecision as i, zControl as n, initializeCommonNormalIntervalsManifest as o, centralNormalProbability as r, commonNormalIntervalsManifest as s, zParameter as t };
