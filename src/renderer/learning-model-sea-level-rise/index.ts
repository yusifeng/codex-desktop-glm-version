// Global mean sea-level rise learning model using the 1993–2024 record.
import "@rchunk/rolldown-runtime";

type ObservationInterval = "earlier" | "later";
interface SeaLevelValues { interval?: unknown; selectedYear?: number | null }

const yearControl = { min: 1993, max: 2024, step: 1, defaultValue: 2024 };
const defaultSeaLevelValues = { interval: "later" as ObservationInterval, selectedYear: yearControl.defaultValue };
const annualSeaLevelChange = [0, 2, 5, 7, 10, 11, 14, 17, 20, 19, 24, 28, 31, 35, 39, 38, 43, 48, 46, 52, 56, 59, 65, 68, 72, 75, 79, 84, 90, 95, 101, 107];
const seaLevelSeries = annualSeaLevelChange.map((change, index) => ({ x: yearControl.min + index, y: change }));
const observationIntervals = { earlier: { start: 1993, end: 2002, rate: 2.1 }, later: { start: 2015, end: 2024, rate: 4.7 } };
const isObservationInterval = (value: unknown): value is ObservationInterval => value === "earlier" || value === "later";
const finiteOr = (value: number | null | undefined, fallback: number): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const seaLevelChangeAt = (year: number): number => {
  const clampedYear = Math.min(yearControl.max, Math.max(yearControl.min, year));
  const lowerIndex = Math.floor(clampedYear) - yearControl.min;
  const upperIndex = Math.min(annualSeaLevelChange.length - 1, lowerIndex + 1);
  const fraction = clampedYear - Math.floor(clampedYear);
  return annualSeaLevelChange[lowerIndex] * (1 - fraction) + annualSeaLevelChange[upperIndex] * fraction;
};

function deriveSeaLevelRiseState(values: SeaLevelValues) {
  const selectedYear = Math.round(Math.min(yearControl.max, Math.max(yearControl.min, finiteOr(values.selectedYear, yearControl.defaultValue))));
  const intervalKey = isObservationInterval(values.interval) ? values.interval : defaultSeaLevelValues.interval;
  const interval = observationIntervals[intervalKey];
  const intervalYears = interval.end - interval.start;
  const intervalStartChange = seaLevelChangeAt(interval.start);
  const intervalEndChange = intervalStartChange + interval.rate * intervalYears;
  return {
    values: { interval: intervalKey, selectedYear },
    selectedChange: seaLevelChangeAt(selectedYear),
    elapsedYears: selectedYear - yearControl.min,
    interval,
    intervalYears,
    intervalChange: intervalEndChange - intervalStartChange,
    intervalStart: { x: interval.start, y: intervalStartChange },
    intervalEnd: { x: interval.end, y: intervalEndChange },
    earlyGuide: { from: { x: observationIntervals.earlier.start, y: seaLevelChangeAt(observationIntervals.earlier.start) }, to: { x: observationIntervals.earlier.end, y: seaLevelChangeAt(observationIntervals.earlier.start) + observationIntervals.earlier.rate * (observationIntervals.earlier.end - observationIntervals.earlier.start) } },
    lateGuide: { from: { x: observationIntervals.later.start, y: seaLevelChangeAt(observationIntervals.later.start) }, to: { x: observationIntervals.later.end, y: seaLevelChangeAt(observationIntervals.later.start) + observationIntervals.later.rate * (observationIntervals.later.end - observationIntervals.later.start) } },
  };
}

function initializeSeaLevelRiseModel(): void {}

export {
  initializeSeaLevelRiseModel as a,
  deriveSeaLevelRiseState as i,
  seaLevelSeries as n,
  yearControl as r,
  defaultSeaLevelValues as t,
};
