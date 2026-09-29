// Dose-response learning model comparing potency and efficacy.
import "@rchunk/rolldown-runtime";

interface DoseResponseValues { logConcentration?: number | null; comparison?: number | null }
interface DoseResponsePoint { x: number; y: number }

let concentrationControl: { defaultValue: number; min: number; max: number; step: number };
let comparisonControl: { defaultValue: number; min: number; max: number; step: number };
let normalizeDoseResponseValues: (values: DoseResponseValues) => { logConcentration: number; comparison: number };
let calculateDoseResponse: (values: DoseResponseValues) => { logConcentration: number; comparison: number; drugA: { ec50Log: number; emax: number; halfMax: number; response: number }; drugB: { ec50Log: number; emax: number; halfMax: number; response: number } };
let sampleDoseResponseCurve: (ec50Log: number, emax: number) => DoseResponsePoint[];
let initialized = false;

function initializeDoseResponseCurveModel(): void {
  if (initialized) return;
  initialized = true;
  concentrationControl = { defaultValue: -8, min: -11, max: -5, step: 0.1 };
  comparisonControl = { defaultValue: 0, min: 0, max: 2, step: 1 };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  normalizeDoseResponseValues = values => ({
    logConcentration: Number.isFinite(values.logConcentration) ? clamp(values.logConcentration ?? concentrationControl.defaultValue, concentrationControl.min, concentrationControl.max) : concentrationControl.defaultValue,
    comparison: Number.isFinite(values.comparison) ? Math.round(clamp(values.comparison ?? comparisonControl.defaultValue, comparisonControl.min, comparisonControl.max)) : comparisonControl.defaultValue,
  });
  const responseAtConcentration = (logConcentration: number, ec50Log: number, emax: number): number => emax / (1 + 10 ** (ec50Log - logConcentration));
  calculateDoseResponse = values => {
    const normalized = normalizeDoseResponseValues(values);
    const ec50Log = normalized.comparison === 0 ? -7 : normalized.comparison === 1 ? -8 : -9;
    const emax = normalized.comparison === 0 ? 100 : 60;
    return { ...normalized, drugA: { ec50Log: -8, emax: 100, halfMax: 50, response: responseAtConcentration(normalized.logConcentration, -8, 100) }, drugB: { ec50Log, emax, halfMax: emax / 2, response: responseAtConcentration(normalized.logConcentration, ec50Log, emax) } };
  };
  sampleDoseResponseCurve = (ec50Log, emax) => Array.from({ length: 121 }, (_unused, index) => {
    const x = concentrationControl.min + index * 0.05;
    return { x, y: responseAtConcentration(x, ec50Log, emax) };
  });
}

export { initializeDoseResponseCurveModel as a, sampleDoseResponseCurve as i, concentrationControl as n, normalizeDoseResponseValues as o, calculateDoseResponse as r, comparisonControl as t };
