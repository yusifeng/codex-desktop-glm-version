// Three-set inclusion-exclusion learning model. Release chunk: model-92f4db76ba27.js.
import "@rchunk/rolldown-runtime";

interface InclusionValues { setACount?: number | null; setBCount?: number | null; setCCount?: number | null; step?: number | null }
interface InclusionManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: {
    setACount: { kind: "integer"; defaultValue: number; min: number; max: number };
    setBCount: { kind: "integer"; defaultValue: number; min: number; max: number };
    setCCount: { kind: "integer"; defaultValue: number; min: number; max: number };
  };
}

let inclusionExclusionManifest: InclusionManifest;
let stepControl: { min: number; max: number; defaultValue: number };
let normalizeStep: (step: number | null | undefined) => number;
let calculateInclusionExclusion: (values: InclusionValues) => {
  values: { setACount: number; setBCount: number; setCCount: number; step: number }; step: number;
  setCounts: { a: number; b: number; c: number }; atomicCounts: Record<string, number>;
  intersectionCounts: { ab: number; ac: number; bc: number; abc: number }; unionCount: number;
  runningTotal: number; multiplicities: Record<string, number>;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeInclusionExclusionManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  inclusionExclusionManifest = {
    type: "THREE_SET_INCLUSION_EXCLUSION", version: 1, thumbnailAssetKey: "three-set-inclusion-exclusion-v1",
    canonicalFormula: "|A \\cup B \\cup C| = |A| + |B| + |C| - |A \\cap B| - |A \\cap C| - |B \\cap C| + |A \\cap B \\cap C|",
    parameters: {
      setACount: { kind: "integer", defaultValue: 21, min: 12, max: 30 },
      setBCount: { kind: "integer", defaultValue: 21, min: 12, max: 30 },
      setCCount: { kind: "integer", defaultValue: 18, min: 12, max: 30 },
    },
  };
}

function initializeThreeSetInclusionExclusionModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeInclusionExclusionManifest();
  stepControl = { min: 1, max: 3, defaultValue: 1 };
  const parameters = { a: inclusionExclusionManifest.parameters.setACount, b: inclusionExclusionManifest.parameters.setBCount, c: inclusionExclusionManifest.parameters.setCCount };
  const overlaps = { abOnly: 4, acOnly: 3, bcOnly: 5, abc: 2 };
  const intersectionCounts = { ab: overlaps.abOnly + overlaps.abc, ac: overlaps.acOnly + overlaps.abc, bc: overlaps.bcOnly + overlaps.abc, abc: overlaps.abc };
  const multiplicities: Record<number, Record<string, number>> = {
    1: { aOnly: 1, bOnly: 1, cOnly: 1, abOnly: 2, acOnly: 2, bcOnly: 2, abc: 3 },
    2: { aOnly: 1, bOnly: 1, cOnly: 1, abOnly: 1, acOnly: 1, bcOnly: 1, abc: 0 },
    3: { aOnly: 1, bOnly: 1, cOnly: 1, abOnly: 1, acOnly: 1, bcOnly: 1, abc: 1 },
  };
  normalizeStep = step => typeof step === "number" && Number.isFinite(step)
    ? Math.min(stepControl.max, Math.max(stepControl.min, Math.round(step)))
    : stepControl.defaultValue;
  const normalizeCount = (value: number | null | undefined, parameter: { defaultValue: number; min: number; max: number }): number =>
    typeof value !== "number" || !Number.isFinite(value)
      ? parameter.defaultValue
      : Math.min(parameter.max, Math.max(parameter.min, Math.round(value)));
  calculateInclusionExclusion = values => {
    const normalized = {
      setACount: normalizeCount(values.setACount, parameters.a), setBCount: normalizeCount(values.setBCount, parameters.b),
      setCCount: normalizeCount(values.setCCount, parameters.c), step: normalizeStep(values.step),
    };
    const setCounts = { a: normalized.setACount, b: normalized.setBCount, c: normalized.setCCount };
    const atomicCounts = {
      aOnly: setCounts.a - overlaps.abOnly - overlaps.acOnly - overlaps.abc,
      bOnly: setCounts.b - overlaps.abOnly - overlaps.bcOnly - overlaps.abc,
      cOnly: setCounts.c - overlaps.acOnly - overlaps.bcOnly - overlaps.abc, ...overlaps,
    };
    const unionCount = Object.values(atomicCounts).reduce((sum, count) => sum + count, 0);
    const singleSetTotal = setCounts.a + setCounts.b + setCounts.c;
    const pairIntersectionTotal = intersectionCounts.ab + intersectionCounts.ac + intersectionCounts.bc;
    const runningTotal = normalized.step === 1 ? singleSetTotal : normalized.step === 2 ? singleSetTotal - pairIntersectionTotal : unionCount;
    return {
      values: normalized, step: normalized.step, setCounts, atomicCounts, intersectionCounts, unionCount, runningTotal,
      multiplicities: multiplicities[normalized.step],
    };
  };
}

export {
  initializeInclusionExclusionManifest as a, normalizeStep as i, calculateInclusionExclusion as n,
  inclusionExclusionManifest as o, initializeThreeSetInclusionExclusionModel as r, stepControl as t,
};
