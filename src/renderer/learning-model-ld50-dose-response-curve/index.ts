// Comparative LD50 dose-response curves on a logarithmic dose axis.
import "@rchunk/rolldown-runtime";

interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface Ld50Values { reference_ld50_mg_per_kg?: number | null; comparison_ld50_mg_per_kg?: number | null; administeredDoseMgPerKg?: number | null }

const ld50Type = "LD50_DOSE_RESPONSE_CURVE";
const ld50Thumbnail = "ld50-dose-response-curve-v1";
const ld50Parameters: { reference_ld50_mg_per_kg: NumberParameter; comparison_ld50_mg_per_kg: NumberParameter } = {
  reference_ld50_mg_per_kg: { kind: "number", defaultValue: 100, min: 3, max: 300 },
  comparison_ld50_mg_per_kg: { kind: "number", defaultValue: 30, min: 3, max: 300 },
};
const ld50Specification = { type: ld50Type, version: 3, thumbnailAssetKey: ld50Thumbnail, parameters: ld50Parameters };
const referenceLd50Parameter = ld50Specification.parameters.reference_ld50_mg_per_kg;
const comparisonLd50Parameter = ld50Specification.parameters.comparison_ld50_mg_per_kg;
const referenceLd50Control = { min: referenceLd50Parameter.min, max: referenceLd50Parameter.max, defaultValue: referenceLd50Parameter.defaultValue };
const comparisonLd50Control = { min: comparisonLd50Parameter.min, max: comparisonLd50Parameter.max, defaultValue: comparisonLd50Parameter.defaultValue };
const administeredDoseControl = { min: 1, max: 1_000, defaultValue: 30 };
const curveStep = 0.01;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeNumber = (value: number | null | undefined, defaultValue: number, minimum: number, maximum: number): number => Number.isFinite(value) ? clamp(value ?? defaultValue, minimum, maximum) : defaultValue;
const normalizeLd50Values = (values: Ld50Values) => ({
  reference_ld50_mg_per_kg: normalizeNumber(values.reference_ld50_mg_per_kg, referenceLd50Control.defaultValue, referenceLd50Control.min, referenceLd50Control.max),
  comparison_ld50_mg_per_kg: normalizeNumber(values.comparison_ld50_mg_per_kg, comparisonLd50Control.defaultValue, comparisonLd50Control.min, comparisonLd50Control.max),
  administeredDoseMgPerKg: normalizeNumber(values.administeredDoseMgPerKg, administeredDoseControl.defaultValue, administeredDoseControl.min, administeredDoseControl.max),
});
const mortalityPercent = (dose: number, ld50: number): number => 100 / (1 + Math.exp(-4 * (Math.log10(dose) - Math.log10(ld50))));
const doseResponseCurve = (ld50: number) => Array.from({ length: 121 }, (_unused, index) => { const x = 3 * index / 120; return { x, y: mortalityPercent(10 ** x, ld50) }; });
const calculateLd50 = (values: Ld50Values) => {
  const normalized = normalizeLd50Values(values);
  const moreToxic = normalized.reference_ld50_mg_per_kg < normalized.comparison_ld50_mg_per_kg ? "reference" : normalized.comparison_ld50_mg_per_kg < normalized.reference_ld50_mg_per_kg ? "comparison" : "equal";
  return { ...normalized, referenceMortalityPercent: mortalityPercent(normalized.administeredDoseMgPerKg, normalized.reference_ld50_mg_per_kg), comparisonMortalityPercent: mortalityPercent(normalized.administeredDoseMgPerKg, normalized.comparison_ld50_mg_per_kg), moreToxic };
};

function initializeLd50Specification(): void {}
function initializeLd50Model(): void {}

export { calculateLd50 as a, normalizeLd50Values as c, referenceLd50Control as i, initializeLd50Specification as l, administeredDoseControl as n, doseResponseCurve as o, curveStep as r, initializeLd50Model as s, comparisonLd50Control as t, ld50Specification as u };
