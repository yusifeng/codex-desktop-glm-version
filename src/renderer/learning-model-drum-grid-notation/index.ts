// Drum-grid notation learning model: edit an eighth- or sixteenth-note groove.
import "@rchunk/rolldown-runtime";

type DrumVoice = "hiHat" | "snare" | "kick";
type Subdivision = 8 | 16;
interface DrumPatternValues { subdivision: number; hiHat: number[]; snare: number[]; kick: number[] }
interface DrumPattern { subdivision: Subdivision; hiHat: number[]; snare: number[]; kick: number[] }

const defaultDrumPattern: DrumPattern = {
  subdivision: 16,
  hiHat: [0, 2, 4, 6, 8, 10, 12, 14],
  snare: [4, 12],
  kick: [0, 8, 11],
};

const normalizeSteps = (steps: number[]): number[] =>
  [...new Set(steps.filter((step) => Number.isInteger(step) && step >= 0 && step < 16))].sort((left, right) => left - right);

function normalizeDrumPattern(values: DrumPatternValues): DrumPattern {
  return {
    subdivision: values.subdivision === 8 ? 8 : 16,
    hiHat: normalizeSteps(values.hiHat),
    snare: normalizeSteps(values.snare),
    kick: normalizeSteps(values.kick),
  };
}

const isStepAllowed = (step: number, subdivision: number): boolean => subdivision === 16 || step % 2 === 0;
const horizontalPositionToStep = (position: number, subdivision: number): number => {
  const step = Math.max(0, Math.min(15, Math.floor(position * 16)));
  return subdivision === 8 ? Math.min(14, Math.round(step / 2) * 2) : step;
};
const findNearestAllowedStep = (steps: number[], target: number, subdivision: number): number | undefined =>
  steps.filter((step) => isStepAllowed(step, subdivision)).reduce<number | undefined>(
    (nearest, step) => nearest == null || Math.abs(step - target) < Math.abs(nearest - target) ? step : nearest,
    undefined,
  );

function moveDrumHit(values: DrumPatternValues, voice: DrumVoice, fromStep: number, toStep: number): DrumPattern {
  const pattern = normalizeDrumPattern(values);
  const voiceSteps = pattern[voice];
  return fromStep === toStep
    || !voiceSteps.includes(fromStep)
    || !isStepAllowed(fromStep, pattern.subdivision)
    || !isStepAllowed(toStep, pattern.subdivision)
    || toStep < 0
    || toStep >= 16
    || voiceSteps.includes(toStep)
    ? pattern
    : { ...pattern, [voice]: [...voiceSteps.filter((step) => step !== fromStep), toStep].sort((left, right) => left - right) };
}

const beatSuffixes = ["", " e", " &", " a"];
const formatDrumStep = (step: number): string => `${Math.floor(step / 4) + 1}${beatSuffixes[step % 4]}`;
const findSubdivisionConflicts = (values: DrumPatternValues) => {
  const pattern = normalizeDrumPattern(values);
  return pattern.subdivision === 16 ? [] : (["hiHat", "snare", "kick"] as DrumVoice[]).flatMap(
    (voice) => pattern[voice].filter((step) => !isStepAllowed(step, pattern.subdivision)).map((step) => ({ voice, step })),
  );
};

function initializeDrumGridNotationModel(): void {}

export {
  findSubdivisionConflicts as a,
  moveDrumHit as c,
  horizontalPositionToStep as i,
  normalizeDrumPattern as l,
  formatDrumStep as n,
  initializeDrumGridNotationModel as o,
  findNearestAllowedStep as r,
  isStepAllowed as s,
  defaultDrumPattern as t,
};
