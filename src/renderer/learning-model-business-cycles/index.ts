// Business-cycle learning model with smoothed expansion and contraction phases.
import "@rchunk/rolldown-runtime";

interface BusinessCycleValues { examinedTime?: number | null }

const businessCycleTimeControl = { min: 0, max: 100, step: 1 };
const defaultBusinessCycleValues = { examinedTime: 27 };
const businessCycleTurningPoints = { firstTrough: 8, peak: 42, trough: 66 };
const businessCycleAnchors = [
  { time: businessCycleTimeControl.min, activity: 48 },
  { time: businessCycleTurningPoints.firstTrough, activity: 40 },
  { time: businessCycleTurningPoints.peak, activity: 84 },
  { time: businessCycleTurningPoints.trough, activity: 42 },
  { time: businessCycleTimeControl.max, activity: 78 },
];
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeBusinessCycleValues = (values: BusinessCycleValues) => ({
  examinedTime: Number.isFinite(values.examinedTime)
    ? clamp(values.examinedTime as number, businessCycleTimeControl.min, businessCycleTimeControl.max)
    : defaultBusinessCycleValues.examinedTime,
});
const smoothstep = (value: number): number => value * value * (3 - 2 * value);

function activityAtTime(time: number): number {
  const safeTime = clamp(time, businessCycleTimeControl.min, businessCycleTimeControl.max);
  const segmentIndex = businessCycleAnchors.findIndex(
    (anchor, index) => index < businessCycleAnchors.length - 1 && safeTime >= anchor.time && safeTime <= businessCycleAnchors[index + 1].time,
  );
  const start = businessCycleAnchors[Math.max(0, segmentIndex)];
  const end = businessCycleAnchors[Math.max(1, segmentIndex + 1)];
  const progress = (safeTime - start.time) / (end.time - start.time);
  return start.activity + (end.activity - start.activity) * smoothstep(progress);
}

const classifyBusinessCyclePhase = (time: number): "peak" | "trough" | "contraction" | "expansion" => {
  const safeTime = clamp(time, businessCycleTimeControl.min, businessCycleTimeControl.max);
  return safeTime === businessCycleTurningPoints.peak ? "peak"
    : safeTime === businessCycleTurningPoints.firstTrough || safeTime === businessCycleTurningPoints.trough ? "trough"
      : safeTime < businessCycleTurningPoints.firstTrough || safeTime > businessCycleTurningPoints.peak && safeTime < businessCycleTurningPoints.trough ? "contraction"
        : "expansion";
};

function sampleBusinessCycle(from = businessCycleTimeControl.min, to = businessCycleTimeControl.max) {
  const start = clamp(from, businessCycleTimeControl.min, businessCycleTimeControl.max);
  const end = clamp(to, start, businessCycleTimeControl.max);
  const sampleCount = Math.max(2, Math.ceil((end - start) * 2) + 1);
  return Array.from({ length: sampleCount }, (_unused, index) => {
    const time = start + (end - start) * index / (sampleCount - 1);
    return { x: time, y: activityAtTime(time) };
  });
}

const defaultBusinessCycleSeries = sampleBusinessCycle();
function initializeBusinessCyclesModel(): void {}

export {
  activityAtTime as a,
  initializeBusinessCyclesModel as c,
  businessCycleTurningPoints as i,
  normalizeBusinessCycleValues as l,
  defaultBusinessCycleValues as n,
  classifyBusinessCyclePhase as o,
  businessCycleTimeControl as r,
  sampleBusinessCycle as s,
  defaultBusinessCycleSeries as t,
};
