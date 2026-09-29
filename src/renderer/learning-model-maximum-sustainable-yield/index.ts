// Fishery maximum-sustainable-yield learning model.
import "@rchunk/rolldown-runtime";

interface FisheryValues { fishingEffort?: number | null }

const fishingEffortControl = { defaultValue: 25, min: 0, max: 100, step: 5 };
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

function normalizeFisheryValues(values: FisheryValues) {
  return {
    fishingEffort: Number.isFinite(values.fishingEffort)
      ? clamp(values.fishingEffort ?? fishingEffortControl.defaultValue, fishingEffortControl.min, fishingEffortControl.max)
      : fishingEffortControl.defaultValue,
  };
}

function sustainableCatchPercentMsy(fishingEffort: number): number {
  const effortFraction = fishingEffort / 100;
  return 400 * effortFraction * (1 - effortFraction);
}

function calculateFisheryState(values: FisheryValues) {
  const { fishingEffort } = normalizeFisheryValues(values);
  const matchingEffort = 100 - fishingEffort;
  return {
    fishingEffort,
    sustainableCatchPercentMsy: sustainableCatchPercentMsy(fishingEffort),
    biomassPercentK: 100 - fishingEffort,
    matchingEffort,
    matchingBiomassPercentK: 100 - matchingEffort,
    state: fishingEffort < 50 ? "low" : fishingEffort === 50 ? "msy" : "overfishing",
  };
}

const createSustainableYieldCurve = () =>
  Array.from({ length: 101 }, (_unused, fishingEffort) => ({
    x: fishingEffort,
    y: sustainableCatchPercentMsy(fishingEffort),
  }));

function initializeMaximumSustainableYieldModel(): void {}

export {
  normalizeFisheryValues as a,
  initializeMaximumSustainableYieldModel as i,
  calculateFisheryState as n,
  sustainableCatchPercentMsy as o,
  createSustainableYieldCurve as r,
  fishingEffortControl as t,
};
