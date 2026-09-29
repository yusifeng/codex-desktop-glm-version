// Rational-inequality learning model: build a sign chart and solution intervals.
import "@rchunk/rolldown-runtime";

interface SignChartValues { step?: number | null }

const signChartStepControl = { min: 1, max: 4, step: 1, defaultValue: 1 };
const rationalInequalityCriticalPoints = [
  { value: -1, source: "denominator" },
  { value: 2, source: "numerator" },
  { value: 4, source: "denominator" },
] as const;
const rationalInequalityIntervals = [
  { id: "left", label: "(-∞, -1)", testPoint: -2 },
  { id: "middle-left", label: "(-1, 2)", testPoint: 0 },
  { id: "middle-right", label: "(2, 4)", testPoint: 3 },
  { id: "right", label: "(4, ∞)", testPoint: 5 },
] as const;

const normalizeStep = (value: number | null | undefined): number =>
  Number.isFinite(value)
    ? Math.min(signChartStepControl.max, Math.max(signChartStepControl.min, Math.round(value as number)))
    : signChartStepControl.defaultValue;
const normalizeSignChartValues = (values: SignChartValues): { step: number } => ({ step: normalizeStep(values.step) });
const factorSign = (value: number, root: number): -1 | 1 => value - root < 0 ? -1 : 1;

function buildRationalInequalitySignChart() {
  return rationalInequalityIntervals.map(({ id, label, testPoint }) => {
    const numerator = factorSign(testPoint, 2);
    const denominatorLeft = factorSign(testPoint, -1);
    const denominatorRight = factorSign(testPoint, 4);
    return { id, label, testPoint, numerator, denominatorLeft, denominatorRight, quotient: numerator * denominatorLeft * denominatorRight };
  });
}

const getRationalInequalitySolution = () => [
  { from: null, to: -1, includeFrom: false, includeTo: false, notation: "(-∞, -1)" },
  { from: 2, to: 4, includeFrom: true, includeTo: false, notation: "[2, 4)" },
];

function initializeRationalInequalitySignChartModel(): void {}

export {
  getRationalInequalitySolution as a,
  buildRationalInequalitySignChart as i,
  rationalInequalityIntervals as n,
  initializeRationalInequalitySignChartModel as o,
  signChartStepControl as r,
  normalizeSignChartValues as s,
  rationalInequalityCriticalPoints as t,
};
