// Decompression melting as a rising mantle parcel crosses the dry solidus.
import "@rchunk/rolldown-runtime";

interface DecompressionMeltingValues { depthKm?: number | null; mantleTemperature?: number | null }

const depthControl = { min: 0, max: 240, step: 1, defaultValue: 190 };
const mantleTemperatureControl = { min: 0, max: 2, step: 1, defaultValue: 1 };
const mantleAdiabatIntercepts = [1030, 1353.2204081632653, 1472.7];
const mantleAdiabatGradient = 0.45;
const decompressedParcelGradient = 1.2;
const kilometersPerPressureUnit = 35;
const onsetToleranceKm = 0.05;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeDecompressionMeltingValues = (values: DecompressionMeltingValues) => ({
  depthKm: Number.isFinite(values.depthKm) ? clamp(values.depthKm ?? depthControl.defaultValue, depthControl.min, depthControl.max) : depthControl.defaultValue,
  mantleTemperature: clamp(Math.round(Number.isFinite(values.mantleTemperature) ? values.mantleTemperature ?? mantleTemperatureControl.defaultValue : mantleTemperatureControl.defaultValue), mantleTemperatureControl.min, mantleTemperatureControl.max),
});
const pressureCoordinate = (depthKm: number): number => depthKm / kilometersPerPressureUnit;
const solidusTemperature = (depthKm: number): number => { const pressure = pressureCoordinate(depthKm); return 1085.7 + 132.9 * pressure - 5.1 * pressure ** 2; };
const liquidusTemperature = (depthKm: number): number => { const pressure = pressureCoordinate(depthKm); return 1780 + 45 * pressure - 2 * pressure ** 2; };
const mantleAdiabatTemperature = (depthKm: number, mantleTemperature: number): number => mantleAdiabatIntercepts[mantleTemperature] + mantleAdiabatGradient * depthKm;
const meltingOnsetDepth = (mantleTemperature: number): number | null => {
  const temperatureDifference = (depthKm: number): number => mantleAdiabatTemperature(depthKm, mantleTemperature) - solidusTemperature(depthKm);
  if (temperatureDifference(depthControl.min) < 0 || temperatureDifference(depthControl.max) > 0) return null;
  let lowerDepth = depthControl.min;
  let upperDepth = depthControl.max;
  for (let iteration = 0; iteration < 40; iteration += 1) {
    const midpoint = (lowerDepth + upperDepth) / 2;
    if (temperatureDifference(midpoint) >= 0) lowerDepth = midpoint; else upperDepth = midpoint;
  }
  return (lowerDepth + upperDepth) / 2;
};
const parcelTemperature = (depthKm: number, mantleTemperature: number): number => {
  const onsetDepth = meltingOnsetDepth(mantleTemperature);
  return onsetDepth === null || depthKm >= onsetDepth
    ? mantleAdiabatTemperature(depthKm, mantleTemperature)
    : mantleAdiabatTemperature(onsetDepth, mantleTemperature) - decompressedParcelGradient * (onsetDepth - depthKm);
};
const calculateDecompressionMelting = (values: DecompressionMeltingValues) => {
  const normalized = normalizeDecompressionMeltingValues(values);
  const onsetDepthKm = meltingOnsetDepth(normalized.mantleTemperature);
  const state = onsetDepthKm === null || normalized.depthKm > onsetDepthKm + onsetToleranceKm ? "solid" : Math.abs(normalized.depthKm - onsetDepthKm) <= onsetToleranceKm ? "first-melt" : "partial-melt";
  return { ...normalized, parcelTemperature: parcelTemperature(normalized.depthKm, normalized.mantleTemperature), solidusTemperature: solidusTemperature(normalized.depthKm), liquidusTemperature: liquidusTemperature(normalized.depthKm), onsetDepthKm, onsetTemperature: onsetDepthKm === null ? null : solidusTemperature(onsetDepthKm), meltProgress: onsetDepthKm === null || normalized.depthKm >= onsetDepthKm ? 0 : (onsetDepthKm - normalized.depthKm) / onsetDepthKm, state };
};

function initializeDecompressionMeltingModel(): void {}

export { initializeDecompressionMeltingModel as a, normalizeDecompressionMeltingValues as c, calculateDecompressionMelting as i, solidusTemperature as l, mantleTemperatureControl as n, liquidusTemperature as o, mantleAdiabatTemperature as r, parcelTemperature as s, depthControl as t };
