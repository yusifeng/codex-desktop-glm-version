// Fatty-acid saturation learning model: double bonds alter packing and melting.
import "@rchunk/rolldown-runtime";

interface FattyAcidValues { doubleBonds?: number | null; temperatureCelsius?: number | null }

const fattyAcidSaturationType = "FATTY_ACID_SATURATION";
const fattyAcidSaturationThumbnail = "fatty-acid-saturation-v1";
const fattyAcidSaturationParameters = {
  doubleBonds: { kind: "integer", defaultValue: 1, min: 0, max: 3 },
  temperatureCelsius: { kind: "number", defaultValue: 20, min: 0, max: 50 },
};
const fattyAcidSaturationDefinition = { type: fattyAcidSaturationType, version: 1, thumbnailAssetKey: fattyAcidSaturationThumbnail, parameters: fattyAcidSaturationParameters };
const doubleBondControl = { ...fattyAcidSaturationDefinition.parameters.doubleBonds, step: 1 };
const fattyAcidTemperatureControl = { ...fattyAcidSaturationDefinition.parameters.temperatureCelsius, step: 1 };
const defaultFattyAcidValues = { doubleBonds: doubleBondControl.defaultValue, temperatureCelsius: fattyAcidTemperatureControl.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const finiteOr = (value: number | null | undefined, fallback: number): number => Number.isFinite(value) ? value as number : fallback;
const normalizeFattyAcidValues = (values: FattyAcidValues) => ({
  doubleBonds: clamp(Math.round(finiteOr(values.doubleBonds, doubleBondControl.defaultValue)), doubleBondControl.min, doubleBondControl.max),
  temperatureCelsius: clamp(finiteOr(values.temperatureCelsius, fattyAcidTemperatureControl.defaultValue), fattyAcidTemperatureControl.min, fattyAcidTemperatureControl.max),
});
const classifySaturation = (doubleBonds: number): "saturated" | "monounsaturated" | "polyunsaturated" =>
  doubleBonds <= 0 ? "saturated" : doubleBonds === 1 ? "monounsaturated" : "polyunsaturated";
const transitionTemperatureFor = (doubleBonds: number): number => 36 - clamp(Math.round(doubleBonds), 0, 3) * 12;
const classifyMaterialState = (temperature: number, transitionTemperature: number): "solidLike" | "liquidLike" | "softening" => {
  const difference = temperature - transitionTemperature;
  return difference < -4 ? "solidLike" : difference > 4 ? "liquidLike" : "softening";
};

function deriveFattyAcidState(values: FattyAcidValues) {
  const safeValues = normalizeFattyAcidValues(values);
  const transitionTemperature = transitionTemperatureFor(safeValues.doubleBonds);
  const packingScore = clamp(
    0.92 - safeValues.doubleBonds * 0.23 - Math.max(safeValues.temperatureCelsius - 10, 0) * 0.008,
    0.08,
    0.92,
  );
  return {
    safeValues,
    saturationClass: classifySaturation(safeValues.doubleBonds),
    transitionTemperature,
    materialState: classifyMaterialState(safeValues.temperatureCelsius, transitionTemperature),
    packingScore,
    packingState: packingScore >= 0.68 ? "tight" : "loose",
  };
}
const deriveSaturatedFattyAcidAtTemperature = (temperatureCelsius: number) => deriveFattyAcidState({ doubleBonds: 0, temperatureCelsius });

function initializeFattyAcidSaturationSchema(): void {}
function initializeFattyAcidSaturationModel(): void {}

export {
  deriveSaturatedFattyAcidAtTemperature as a,
  initializeFattyAcidSaturationSchema as c,
  deriveFattyAcidState as i,
  fattyAcidSaturationDefinition as l,
  doubleBondControl as n,
  initializeFattyAcidSaturationModel as o,
  fattyAcidTemperatureControl as r,
  normalizeFattyAcidValues as s,
  defaultFattyAcidValues as t,
};
