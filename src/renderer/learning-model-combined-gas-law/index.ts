// Combined-gas-law learning model.
import "@rchunk/rolldown-runtime";

interface CombinedGasLawValues { pressure2Atm?: number | null; temperature2Kelvin?: number | null }

const initialGasState = { pressureAtm: 1, volumeLiters: 12, temperatureKelvin: 300 };
const pressureControl = { min: 0.7, max: 1.6, step: 0.05, defaultValue: 1.3 };
const temperatureControl = { min: 240, max: 420, step: 10, defaultValue: 330 };
const minimumParticleScale = 0.8;
const baselineParticleScale = 2.4;
const clampOrDefault = (value: number | null | undefined, minimum: number, maximum: number, fallback: number): number =>
  typeof value !== "number" || !Number.isFinite(value) ? fallback : Math.min(Math.max(value, minimum), maximum);
const createDefaultCombinedGasLawValues = () => ({ pressure2Atm: pressureControl.defaultValue, temperature2Kelvin: temperatureControl.defaultValue });
const normalizeCombinedGasLawValues = (values: CombinedGasLawValues) => ({
  pressure2Atm: clampOrDefault(values.pressure2Atm, pressureControl.min, pressureControl.max, pressureControl.defaultValue),
  temperature2Kelvin: clampOrDefault(values.temperature2Kelvin, temperatureControl.min, temperatureControl.max, temperatureControl.defaultValue),
});

function calculateCombinedGasLaw(values: CombinedGasLawValues) {
  const normalized = normalizeCombinedGasLawValues(values);
  const volume2Liters = initialGasState.pressureAtm * initialGasState.volumeLiters * normalized.temperature2Kelvin
    / (initialGasState.temperatureKelvin * normalized.pressure2Atm);
  const state1Ratio = initialGasState.pressureAtm * initialGasState.volumeLiters / initialGasState.temperatureKelvin;
  const state2Ratio = normalized.pressure2Atm * volume2Liters / normalized.temperature2Kelvin;
  return { ...normalized, volume2Liters, state1Ratio, state2Ratio };
}

const volumeToParticleFraction = (volumeLiters: number): number => Math.min(Math.max(volumeLiters / 26, 0), 1);
const pressureToFraction = (pressureAtm: number): number => (pressureAtm - pressureControl.min) / (pressureControl.max - pressureControl.min);
const classifyTemperatureChange = (temperatureKelvin: number): "cooling" | "heating" | "same" =>
  temperatureKelvin < initialGasState.temperatureKelvin ? "cooling" : temperatureKelvin > initialGasState.temperatureKelvin ? "heating" : "same";
const temperatureToParticleCount = (temperatureKelvin: number): number => {
  const temperature = Math.min(Math.max(temperatureKelvin, temperatureControl.min), temperatureControl.max);
  if (temperature <= initialGasState.temperatureKelvin) {
    const progress = (temperature - temperatureControl.min) / (initialGasState.temperatureKelvin - temperatureControl.min);
    return minimumParticleScale + progress * 1.5999999999999999;
  }
  const progress = (temperature - initialGasState.temperatureKelvin) / (temperatureControl.max - initialGasState.temperatureKelvin);
  return baselineParticleScale + progress * 3.6;
};

function initializeCombinedGasLawModel(): void {}

export {
  pressureToFraction as a,
  volumeToParticleFraction as c,
  calculateCombinedGasLaw as d,
  createDefaultCombinedGasLawValues as i,
  initializeCombinedGasLawModel as l,
  initialGasState as n,
  temperatureToParticleCount as o,
  temperatureControl as r,
  classifyTemperatureChange as s,
  pressureControl as t,
  normalizeCombinedGasLawValues as u,
};
