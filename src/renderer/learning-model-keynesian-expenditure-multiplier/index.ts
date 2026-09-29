// Keynesian-cross learning model: autonomous spending shifts and the expenditure multiplier.
// Release chunk: app/webview/assets/model-a5deb44334b8.js.
import "@rchunk/rolldown-runtime";

interface ExpenditureValues { autonomousShift?: number | null; marginalPropensityToConsume?: number | null }
interface NormalizedExpenditureValues { autonomousShift: number; marginalPropensityToConsume: number }

let autonomousShiftControl: { min: number; max: number; step: number; defaultValue: number };
let marginalPropensityControl: { min: number; max: number; step: number; defaultValue: number };
let outputBounds: { min: number; max: number };
let defaultExpenditureValues: NormalizedExpenditureValues;
let normalizeExpenditureValues: (values: ExpenditureValues) => NormalizedExpenditureValues;
let calculateExpenditureEquilibrium: (values: ExpenditureValues) => NormalizedExpenditureValues & {
  baselineEquilibrium: number; equilibrium: number; equilibriumChange: number; multiplier: number;
  baselineIntercept: number; shiftedIntercept: number; belowOutput: number; belowPlannedExpenditure: number;
  aboveOutput: number; abovePlannedExpenditure: number;
};
let initialized = false;

function initializeKeynesianExpenditureMultiplierModel(): void {
  if (initialized) return;
  initialized = true;
  autonomousShiftControl = { min: -12, max: 12, step: 1, defaultValue: 8 };
  marginalPropensityControl = { min: 0.4, max: 0.75, step: 0.05, defaultValue: 0.6 };
  outputBounds = { min: 0, max: 180 };
  const graphPadding = 40;
  defaultExpenditureValues = {
    autonomousShift: autonomousShiftControl.defaultValue,
    marginalPropensityToConsume: marginalPropensityControl.defaultValue,
  };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  const finiteOr = (value: number | null | undefined, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  normalizeExpenditureValues = values => ({
    autonomousShift: clamp(finiteOr(values.autonomousShift, autonomousShiftControl.defaultValue), autonomousShiftControl.min, autonomousShiftControl.max),
    marginalPropensityToConsume: clamp(
      finiteOr(values.marginalPropensityToConsume, marginalPropensityControl.defaultValue),
      marginalPropensityControl.min, marginalPropensityControl.max,
    ),
  });
  calculateExpenditureEquilibrium = values => {
    const normalized = normalizeExpenditureValues(values);
    const multiplier = 1 / (1 - normalized.marginalPropensityToConsume);
    const baselineEquilibrium = 24 * multiplier;
    const shiftedIntercept = 24 + normalized.autonomousShift;
    const equilibrium = shiftedIntercept * multiplier;
    const belowOutput = Math.max(outputBounds.min + 10, equilibrium - graphPadding);
    const aboveOutput = Math.min(outputBounds.max - 8, equilibrium + graphPadding);
    return {
      ...normalized, baselineEquilibrium, equilibrium, equilibriumChange: equilibrium - baselineEquilibrium,
      multiplier, baselineIntercept: 24, shiftedIntercept, belowOutput,
      belowPlannedExpenditure: shiftedIntercept + normalized.marginalPropensityToConsume * belowOutput,
      aboveOutput, abovePlannedExpenditure: shiftedIntercept + normalized.marginalPropensityToConsume * aboveOutput,
    };
  };
}

export {
  calculateExpenditureEquilibrium as a, marginalPropensityControl as i, outputBounds as n,
  initializeKeynesianExpenditureMultiplierModel as o, defaultExpenditureValues as r,
  normalizeExpenditureValues as s, autonomousShiftControl as t,
};
