// Sleep-stage intervals across a configurable overnight hypnogram.
import "@rchunk/rolldown-runtime";

type SleepStage = "wake" | "n1" | "n2" | "n3" | "rem";
interface SleepCycleValues { sleep_duration_hours?: number | null; selectedTimeHours?: number | null }
interface SleepInterval { start: number; end: number; stage: SleepStage; cycle: number }

const sleepCycleSpecification = {
  type: "SLEEP_CYCLE_HYPNOGRAM",
  version: 2,
  thumbnailAssetKey: "sleep-cycle-hypnogram-v1",
  parameters: { sleep_duration_hours: { kind: "number" as const, defaultValue: 8, min: 5, max: 10 } },
};
const selectedTimeControl = { min: 0, max: 10, step: 0.1, defaultValue: 1 };
const sleepDurationParameter = sleepCycleSpecification.parameters.sleep_duration_hours;
const rawIntervals: Array<readonly [number, number, SleepStage, number]> = [
  [0, 10, "wake", 1], [10, 15, "n1", 1], [15, 35, "n2", 1], [35, 70, "n3", 1], [70, 90, "n2", 1], [90, 100, "rem", 1],
  [100, 103, "n1", 2], [103, 126, "n2", 2], [126, 158, "n3", 2], [158, 185, "n2", 2], [185, 200, "rem", 2],
  [200, 203, "n1", 3], [203, 229, "n2", 3], [229, 249, "n3", 3], [249, 279, "n2", 3], [279, 300, "rem", 3],
  [300, 304, "wake", 4], [304, 307, "n1", 4], [307, 330, "n2", 4], [330, 338, "n3", 4], [338, 373, "n2", 4], [373, 400, "rem", 4],
  [400, 404, "wake", 5], [404, 407, "n1", 5], [407, 440, "n2", 5], [440, 474, "rem", 5],
  [474, 480, "wake", 6], [480, 483, "n1", 6], [483, 548, "n2", 6], [548, 585, "rem", 6],
  [585, 590, "wake", 7], [590, 593, "n1", 7], [593, 650, "n2", 7],
];
const baseIntervals: SleepInterval[] = rawIntervals.map(([start, end, stage, cycle]) => ({ start: start / 60, end: end / 60, stage, cycle }));
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const buildIntervals = (durationHours: number): SleepInterval[] => {
  const wakeStart = durationHours - 0.1;
  const intervals = baseIntervals.filter(({ start }) => start < wakeStart).map((interval) => ({ ...interval, end: Math.min(interval.end, wakeStart) }));
  const lastInterval = intervals.at(-1);
  return [...intervals, { start: wakeStart, end: durationHours, stage: "wake", cycle: lastInterval?.cycle ?? 1 }];
};
const normalizeSleepCycleValues = (values: SleepCycleValues) => {
  const duration = typeof values.sleep_duration_hours === "number" && Number.isFinite(values.sleep_duration_hours)
    ? clamp(values.sleep_duration_hours, sleepDurationParameter.min, sleepDurationParameter.max)
    : sleepDurationParameter.defaultValue;
  const selectedTimeHours = typeof values.selectedTimeHours === "number" && Number.isFinite(values.selectedTimeHours)
    ? clamp(values.selectedTimeHours, selectedTimeControl.min, duration)
    : clamp(selectedTimeControl.defaultValue, selectedTimeControl.min, duration);
  return { sleep_duration_hours: duration, selectedTimeHours };
};
const calculateSleepCycle = (values: SleepCycleValues) => {
  const normalized = normalizeSleepCycleValues(values);
  const intervals = buildIntervals(normalized.sleep_duration_hours);
  const interval = intervals.find(({ start, end }) => normalized.selectedTimeHours >= start && normalized.selectedTimeHours < end) ?? intervals.at(-1)!;
  const deepSleepInterval = intervals.find(({ cycle, stage }) => cycle === interval.cycle && stage === "n3");
  const nremPhase = interval.stage === "n1" || interval.stage === "n2"
    ? deepSleepInterval && interval.end <= deepSleepInterval.start ? "toward-deep" : "toward-rem"
    : null;
  return { ...normalized, intervals, elapsedHours: normalized.selectedTimeHours, interval, nremPhase };
};

function initializeSleepCycleSpecification(): void {}
function initializeSleepCycleModel(): void {}

export { initializeSleepCycleSpecification as a, initializeSleepCycleModel as i, selectedTimeControl as n, sleepCycleSpecification as o, calculateSleepCycle as r, sleepDurationParameter as t };
