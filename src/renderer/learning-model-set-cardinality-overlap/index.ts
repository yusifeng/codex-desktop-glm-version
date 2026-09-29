// Two-set counting model: derive exclusive and union cardinalities from an overlap.
import "@rchunk/rolldown-runtime";

interface SetCardinalityValues {
  setACount?: number;
  setBCount?: number;
  overlapCount?: number;
}

const setACountControl = { min: 1, max: 12, step: 1, defaultValue: 8 };
const setBCountControl = { min: 1, max: 12, step: 1, defaultValue: 7 };
const overlapCountControl = {
  min: 0,
  max: Math.min(setACountControl.max, setBCountControl.max),
  step: 1,
  defaultValue: 3,
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

function normalizeSetCardinalityValues(values: SetCardinalityValues) {
  const setACandidate =
    typeof values.setACount === "number" && Number.isFinite(values.setACount)
      ? Math.round(values.setACount)
      : setACountControl.defaultValue;
  const setBCandidate =
    typeof values.setBCount === "number" && Number.isFinite(values.setBCount)
      ? Math.round(values.setBCount)
      : setBCountControl.defaultValue;
  const setACount = clamp(setACandidate, setACountControl.min, setACountControl.max);
  const setBCount = clamp(setBCandidate, setBCountControl.min, setBCountControl.max);
  const overlapCandidate =
    typeof values.overlapCount === "number" && Number.isFinite(values.overlapCount)
      ? Math.round(values.overlapCount)
      : overlapCountControl.defaultValue;
  return {
    setACount,
    setBCount,
    overlapCount: clamp(overlapCandidate, overlapCountControl.min, Math.min(setACount, setBCount)),
  };
}

function calculateSetCardinalities(values: SetCardinalityValues) {
  const normalized = normalizeSetCardinalityValues(values);
  return {
    ...normalized,
    onlyACount: normalized.setACount - normalized.overlapCount,
    onlyBCount: normalized.setBCount - normalized.overlapCount,
    unionCount: normalized.setACount + normalized.setBCount - normalized.overlapCount,
  };
}

function initializeSetCardinalityOverlapModel(): void {}

export {
  initializeSetCardinalityOverlapModel as a,
  calculateSetCardinalities as i,
  setACountControl as n,
  normalizeSetCardinalityValues as o,
  setBCountControl as r,
  overlapCountControl as t,
};
