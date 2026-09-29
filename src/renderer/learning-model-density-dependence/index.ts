// Logistic density-dependence learning model. Release chunk: model-43a9f02da387.js.
import "@rchunk/rolldown-runtime";

interface DensityValues { carrying_capacity?: number | null; intrinsic_growth_rate?: number | null; current_density?: number | null }
interface NormalizedDensityValues { carrying_capacity: number; intrinsic_growth_rate: number; current_density: number }
interface DensityManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    carrying_capacity: { kind: "integer"; defaultValue: number; min: number; max: number };
    intrinsic_growth_rate: { kind: "number"; defaultValue: number; min: number; max: number };
  };
}

let densityDependenceManifest: DensityManifest;
let carryingCapacityControl: { defaultValue: number; min: number; max: number; step: number };
let intrinsicGrowthControl: { defaultValue: number; min: number; max: number; step: number };
let normalizeDensityValues: (values: DensityValues) => NormalizedDensityValues;
let calculateDensityDependence: (values: DensityValues) => {
  carryingCapacity: number; intrinsicGrowthRate: number; currentDensity: number; densityDependentRate: number;
  densityIndependentRate: number; state: "stable" | "growing" | "declining";
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeDensityDependenceManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  densityDependenceManifest = {
    type: "DENSITY_DEPENDENCE", version: 2, thumbnailAssetKey: "density-dependence-v1",
    parameters: {
      carrying_capacity: { kind: "integer", defaultValue: 100, min: 40, max: 200 },
      intrinsic_growth_rate: { kind: "number", defaultValue: 0.4, min: 0.1, max: 0.8 },
    },
  };
}

function initializeDensityDependenceModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeDensityDependenceManifest();
  carryingCapacityControl = { ...densityDependenceManifest.parameters.carrying_capacity, step: 1 };
  intrinsicGrowthControl = { ...densityDependenceManifest.parameters.intrinsic_growth_rate, step: 0.01 };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  normalizeDensityValues = values => {
    const carryingCapacity = typeof values.carrying_capacity === "number" && Number.isFinite(values.carrying_capacity)
      ? clamp(Math.round(values.carrying_capacity), carryingCapacityControl.min, carryingCapacityControl.max)
      : carryingCapacityControl.defaultValue;
    return {
      carrying_capacity: carryingCapacity,
      intrinsic_growth_rate: typeof values.intrinsic_growth_rate === "number" && Number.isFinite(values.intrinsic_growth_rate)
        ? clamp(values.intrinsic_growth_rate, intrinsicGrowthControl.min, intrinsicGrowthControl.max)
        : intrinsicGrowthControl.defaultValue,
      current_density: typeof values.current_density === "number" && Number.isFinite(values.current_density)
        ? clamp(values.current_density, 1, carryingCapacity * 2)
        : carryingCapacity * 0.6,
    };
  };
  calculateDensityDependence = values => {
    const normalized = normalizeDensityValues(values);
    const densityDependentRate = normalized.intrinsic_growth_rate * (1 - normalized.current_density / normalized.carrying_capacity);
    return {
      carryingCapacity: normalized.carrying_capacity, intrinsicGrowthRate: normalized.intrinsic_growth_rate,
      currentDensity: normalized.current_density, densityDependentRate,
      densityIndependentRate: normalized.intrinsic_growth_rate * 0.65,
      state: Math.abs(densityDependentRate) < 1e-9 ? "stable" : densityDependentRate > 0 ? "growing" : "declining",
    };
  };
}

export {
  normalizeDensityValues as a, initializeDensityDependenceModel as i, intrinsicGrowthControl as n,
  initializeDensityDependenceManifest as o, calculateDensityDependence as r, densityDependenceManifest as s, carryingCapacityControl as t,
};
