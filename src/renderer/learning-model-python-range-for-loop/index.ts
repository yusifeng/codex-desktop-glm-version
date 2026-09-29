// Python range-for-loop learning model with a stepwise execution trace.
import "@rchunk/rolldown-runtime";

interface PythonRangeValues { start?: number | null; stop?: number | null; step?: number | null; trace?: number | null }

const pythonRangeType = "PYTHON_RANGE_FOR_LOOP";
const pythonRangeThumbnail = "python-range-for-loop-v1";
const pythonRangeParameters = {
  start: { kind: "integer", defaultValue: 2, min: -4, max: 10 },
  stop: { kind: "integer", defaultValue: 10, min: -4, max: 10 },
  step: { kind: "integer", defaultValue: 2, min: -4, max: 4 },
};
const pythonRangeDefinition = { type: pythonRangeType, version: 3, thumbnailAssetKey: pythonRangeThumbnail, parameters: pythonRangeParameters };
const pythonRangeControls = { start: pythonRangeDefinition.parameters.start, stop: pythonRangeDefinition.parameters.stop, step: pythonRangeDefinition.parameters.step };
const normalizeRangeInteger = (value: number | null | undefined, control: { min: number; max: number; defaultValue: number }): number =>
  Math.min(control.max, Math.max(control.min, Math.round(Number.isFinite(value) ? value ?? 0 : control.defaultValue)));
const createDefaultPythonRangeValues = () => ({
  start: pythonRangeControls.start.defaultValue,
  stop: pythonRangeControls.stop.defaultValue,
  step: pythonRangeControls.step.defaultValue,
  trace: 0,
});

function derivePythonRangeState(values: PythonRangeValues) {
  const start = normalizeRangeInteger(values.start, pythonRangeControls.start);
  const stop = normalizeRangeInteger(values.stop, pythonRangeControls.stop);
  const step = normalizeRangeInteger(values.step, pythonRangeControls.step);
  const invalid = step === 0;
  const sequence: number[] = [];
  if (!invalid) {
    for (let value = start; step > 0 ? value < stop : value > stop; value += step) sequence.push(value);
  }
  const requestedTrace = Number.isFinite(values.trace) ? Math.round(values.trace ?? 0) : 0;
  const trace = Math.min(sequence.length, Math.max(0, requestedTrace));
  const emptyReason = invalid || sequence.length > 0 ? null : start === stop ? "equal" : "direction";
  return {
    current: trace > 0 ? sequence[trace - 1] ?? null : null,
    emptyReason,
    invalid,
    nextCandidate: sequence.length > 0 ? (sequence.at(-1) ?? start) + step : null,
    sequence,
    values: { start, stop, step, trace },
  };
}
const advancePythonRangeTrace = (values: PythonRangeValues) => {
  const state = derivePythonRangeState(values);
  const { trace } = state.values;
  return { ...state.values, trace: state.sequence.length === 0 || trace === state.sequence.length ? 0 : trace + 1 };
};

function initializePythonRangeSchema(): void {}
function initializePythonRangeModel(): void {}

export {
  initializePythonRangeModel as a,
  createDefaultPythonRangeValues as i,
  advancePythonRangeTrace as n,
  initializePythonRangeSchema as o,
  derivePythonRangeState as r,
  pythonRangeDefinition as s,
  pythonRangeControls as t,
};
