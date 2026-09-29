// Binary-search learning model with step-by-step candidate intervals.
import "@rchunk/rolldown-runtime";

interface BinarySearchValues { target?: number | null; step?: number | null }
interface SearchFrame { low: number; high: number; mid: number | null; comparison: "equal" | "less" | "greater" | "empty"; candidateCount: number; discardedLow: number | null; discardedHigh: number | null }

const binarySearchType = "BINARY_SEARCH";
const binarySearchThumbnail = "binary-search-v1";
const binarySearchParameters = { target: { kind: "integer", defaultValue: 55, min: 10, max: 100 } };
const binarySearchDefinition = { type: binarySearchType, version: 2, thumbnailAssetKey: binarySearchThumbnail, parameters: binarySearchParameters };
const sortedValues = [17, 20, 26, 31, 44, 54, 55, 65, 77, 93];
const targetParameter = binarySearchDefinition.parameters.target;
const normalizeBinarySearchValues = (values: BinarySearchValues) => ({
  target: Number.isFinite(values.target) ? Math.min(Math.max(Math.round(values.target as number), targetParameter.min), targetParameter.max) : targetParameter.defaultValue,
  step: Number.isFinite(values.step) ? Math.max(0, Math.round(values.step as number)) : 0,
});
const buildBinarySearchFrames = (target: number): SearchFrame[] => {
  const frames: SearchFrame[] = [];
  let low = 0;
  let high = sortedValues.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const value = sortedValues[mid];
    const candidateCount = high - low + 1;
    if (target === value) { frames.push({ low, high, mid, comparison: "equal", candidateCount, discardedLow: null, discardedHigh: null }); return frames; }
    if (target < value) { frames.push({ low, high, mid, comparison: "less", candidateCount, discardedLow: mid, discardedHigh: high }); high = mid - 1; }
    else { frames.push({ low, high, mid, comparison: "greater", candidateCount, discardedLow: low, discardedHigh: mid }); low = mid + 1; }
  }
  frames.push({ low, high, mid: null, comparison: "empty", candidateCount: 0, discardedLow: null, discardedHigh: null });
  return frames;
};
const getNextCandidateInterval = (frame: SearchFrame) => {
  if (frame.mid === null || frame.comparison === "equal") return null;
  const low = frame.comparison === "greater" ? frame.mid + 1 : frame.low;
  const high = frame.comparison === "less" ? frame.mid - 1 : frame.high;
  return { low, high, candidateCount: Math.max(0, high - low + 1) };
};

function deriveBinarySearchState(values: BinarySearchValues) {
  const normalized = normalizeBinarySearchValues(values);
  const frames = buildBinarySearchFrames(normalized.target);
  const step = Math.min(normalized.step, frames.length - 1);
  const frame = frames[step];
  const nextInterval = getNextCandidateInterval(frame);
  const candidateHistory = frames.slice(0, step + 1).map((item) => item.candidateCount);
  if (nextInterval) candidateHistory.push(nextInterval.candidateCount);
  return { values: { ...normalized, step }, frames, frame, maxStep: frames.length - 1, candidateHistory, nextInterval };
}
const createDefaultBinarySearchValues = () => ({ target: targetParameter.defaultValue, step: 0 });

function initializeBinarySearchSchema(): void {}
function initializeBinarySearchModel(): void {}

export {
  initializeBinarySearchSchema as a,
  initializeBinarySearchModel as i,
  deriveBinarySearchState as n,
  binarySearchDefinition as o,
  createDefaultBinarySearchValues as r,
  sortedValues as t,
};
