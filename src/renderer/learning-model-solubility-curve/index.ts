// Solubility-curve learning model for three solids in water.
import "@rchunk/rolldown-runtime";

type Solute = "potassium nitrate" | "sodium chloride" | "cerium(III) sulfate";
interface SolubilityValues { solute?: unknown; temperatureC?: number | null; dissolvedGrams?: number | null }

const solubilityCurveType = "SOLUBILITY_CURVE";
const solubilityCurveThumbnail = "solubility-curve-v1";
const solubilityCurveParameters = { solute: { kind: "enum", defaultValue: "potassium nitrate" as Solute, allowedValues: ["potassium nitrate", "sodium chloride", "cerium(III) sulfate"] as Solute[] } };
const solubilityCurveDefinition = { type: solubilityCurveType, version: 2, thumbnailAssetKey: solubilityCurveThumbnail, parameters: solubilityCurveParameters };
const temperatureControl = { defaultValue: 40, min: 0, max: 100, step: 1 };
const dissolvedGramsControl = { defaultValue: 80, min: 0, max: 250, step: 1 };
const soluteParameter = solubilityCurveDefinition.parameters.solute;
const soluteControl = { defaultValue: soluteParameter.defaultValue, allowedValues: soluteParameter.allowedValues };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const isSolute = (value: unknown): value is Solute => value === "potassium nitrate" || value === "sodium chloride" || value === "cerium(III) sulfate";
const normalizeSolubilityValues = (values: SolubilityValues) => ({
  solute: isSolute(values.solute) ? values.solute : soluteControl.defaultValue,
  temperatureC: Number.isFinite(values.temperatureC) ? clamp(values.temperatureC as number, temperatureControl.min, temperatureControl.max) : temperatureControl.defaultValue,
  dissolvedGrams: Number.isFinite(values.dissolvedGrams) ? clamp(values.dissolvedGrams as number, dissolvedGramsControl.min, dissolvedGramsControl.max) : dissolvedGramsControl.defaultValue,
});
const saturationAtTemperature = (solute: Solute, temperatureC: number): number => solute === "potassium nitrate"
  ? 13.3 + 0.4 * temperatureC + 0.019 * temperatureC ** 2
  : solute === "sodium chloride" ? 35.7 + 0.038 * temperatureC : 2 + 20 * Math.exp(-temperatureC / 22);

function deriveSolubilityState(values: SolubilityValues) {
  const normalized = normalizeSolubilityValues(values);
  const saturationGrams = saturationAtTemperature(normalized.solute, normalized.temperatureC);
  const differenceGrams = normalized.dissolvedGrams - saturationGrams;
  const warmTemperatureC = Math.max(normalized.temperatureC, 80);
  const coldTemperatureC = Math.min(normalized.temperatureC, 80);
  const warmSaturationGrams = saturationAtTemperature(normalized.solute, warmTemperatureC);
  const coldSaturationGrams = saturationAtTemperature(normalized.solute, coldTemperatureC);
  return {
    ...normalized,
    saturationGrams,
    differenceGrams,
    state: Math.abs(differenceGrams) < 0.5 ? "saturated" : differenceGrams < 0 ? "unsaturated" : "supersaturated",
    warmTemperatureC,
    coldTemperatureC,
    warmSaturationGrams,
    coldSaturationGrams,
    crystallizedGrams: Math.max(0, warmSaturationGrams - coldSaturationGrams),
  };
}
const buildSolubilityCurve = (solute: Solute) => Array.from({ length: 101 }, (_unused, temperatureC) => ({ x: temperatureC, y: saturationAtTemperature(solute, temperatureC) }));

function initializeSolubilityCurveSchema(): void {}
function initializeSolubilityCurveModel(): void {}

export {
  buildSolubilityCurve as a,
  solubilityCurveDefinition as c,
  deriveSolubilityState as i,
  soluteControl as n,
  initializeSolubilityCurveModel as o,
  temperatureControl as r,
  initializeSolubilityCurveSchema as s,
  dissolvedGramsControl as t,
};
