// Deterministic token draws for permutation and combination selection processes.
import "@rchunk/rolldown-runtime";

type SelectionMode = "ordered-with-replacement" | "ordered-without-replacement" | "unordered-without-replacement";
interface SelectionProcessOptions { mode: SelectionMode; optionCount: number; selectionCount: number }
interface SelectionDraw { availableTokenIds: number[]; drawIndex: number; selectedTokenId: number; resultIndex: number }
interface SelectionProcess { draws: SelectionDraw[]; durationSeconds: number; mode: SelectionMode; optionCount: number; resultTokenIds: number[]; selectionCount: number; selectionOrderTokenIds: number[]; signature: string }

const drawDurationSeconds = 1.25;
const selectedPhaseStart = 0.24;
const movingPhaseStart = 0.34;
const placedPhaseStart = 0.84;
const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
};
const seededRandom = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state += 1831565813;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};
const uniformIndex = (randomValue: number, possibilityCount: number): number => {
  if (!Number.isInteger(possibilityCount) || possibilityCount < 1) throw new Error("A uniform selection needs at least one possibility");
  return Math.floor(Math.min(Math.max(randomValue, 0), 1 - 2 ** -52) * possibilityCount);
};
const smoothstep = (value: number): number => value * value * (3 - 2 * value);
const buildSelectionProcess = ({ mode, optionCount, selectionCount }: SelectionProcessOptions): SelectionProcess => {
  if (!Number.isInteger(optionCount) || optionCount < 1) throw new Error("optionCount must be a positive integer");
  if (!Number.isInteger(selectionCount) || selectionCount < 1) throw new Error("selectionCount must be a positive integer");
  if (mode !== "ordered-with-replacement" && selectionCount > optionCount) throw new Error("Selections without replacement cannot exceed the options");
  const tokenIds = Array.from({ length: optionCount }, (_, index) => index + 1);
  const random = seededRandom(hashString(`selection-process:${optionCount}:${selectionCount}`));
  let availableTokenIds = tokenIds;
  const rawDraws: Array<Omit<SelectionDraw, "resultIndex">> = [];
  for (let drawIndex = 0; drawIndex < selectionCount; drawIndex += 1) {
    const availableAtDraw = [...availableTokenIds];
    const selectedTokenId = availableAtDraw[uniformIndex(random(), availableAtDraw.length)];
    rawDraws.push({ availableTokenIds: availableAtDraw, drawIndex, selectedTokenId });
    if (mode !== "ordered-with-replacement") availableTokenIds = availableTokenIds.filter((tokenId) => tokenId !== selectedTokenId);
  }
  const selectionOrderTokenIds = rawDraws.map(({ selectedTokenId }) => selectedTokenId);
  const resultTokenIds = mode === "unordered-without-replacement" ? [...selectionOrderTokenIds].sort((left, right) => left - right) : selectionOrderTokenIds;
  return {
    draws: rawDraws.map((draw) => ({ ...draw, resultIndex: mode === "unordered-without-replacement" ? resultTokenIds.indexOf(draw.selectedTokenId) : draw.drawIndex })),
    durationSeconds: selectionCount * drawDurationSeconds, mode, optionCount, resultTokenIds, selectionCount, selectionOrderTokenIds,
    signature: `${mode}:${optionCount}:${selectionCount}:${selectionOrderTokenIds.join("-")}`,
  };
};
const selectionFrameAtTime = (process: SelectionProcess, timeSeconds: number) => {
  const elapsed = Math.min(Math.max(Number.isFinite(timeSeconds) ? timeSeconds : 0, 0), process.durationSeconds);
  const complete = elapsed === process.durationSeconds;
  const activeDrawIndex = complete ? process.draws.length - 1 : Math.min(Math.floor(elapsed / drawDurationSeconds), process.draws.length - 1);
  const drawProgress = complete ? 1 : (elapsed - activeDrawIndex * drawDurationSeconds) / drawDurationSeconds;
  const movementProgress = smoothstep(Math.min(Math.max((drawProgress - movingPhaseStart) / (placedPhaseStart - movingPhaseStart), 0), 1));
  const phase = drawProgress < selectedPhaseStart ? "available" : drawProgress < movingPhaseStart ? "selected" : drawProgress < placedPhaseStart ? "moving" : "placed";
  return { activeDraw: process.draws[activeDrawIndex], activeDrawIndex, movementProgress, phase, settledDrawCount: activeDrawIndex + Number(phase === "placed") };
};
const countOrderedSelections = (optionCount: number, selectionCount: number, withReplacement: boolean): number => withReplacement ? optionCount ** selectionCount : Array.from({ length: selectionCount }, (_, index) => optionCount - index).reduce((product, value) => product * value, 1);
const countCombinations = (optionCount: number, selectionCount: number): number => {
  const smallerSelection = Math.min(selectionCount, optionCount - selectionCount);
  let result = 1;
  for (let index = 1; index <= smallerSelection; index += 1) result = result * (optionCount - smallerSelection + index) / index;
  return Math.round(result);
};

function initializeSelectionProcessModel(): void {}

export { initializeSelectionProcessModel as a, selectionFrameAtTime as i, countOrderedSelections as n, countCombinations as r, buildSelectionProcess as t };
