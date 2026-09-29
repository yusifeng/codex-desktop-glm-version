// Recrystallization model: estimate dissolved solute and recovered crystals after cooling.
import "@rchunk/rolldown-runtime";

interface RecrystallizationInput { coolingTemperature?: number | null; solventProfile?: number | null }

const coolingTemperatureControl = { min: 0, max: 80, step: 1, defaultValue: 35 };
const solventProfileControl = { min: 0, max: 1, step: 1, defaultValue: 0 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeRecrystallizationInput = (input: RecrystallizationInput) => ({
  coolingTemperature: Number.isFinite(input.coolingTemperature) ? clamp(input.coolingTemperature ?? coolingTemperatureControl.defaultValue, coolingTemperatureControl.min, coolingTemperatureControl.max) : coolingTemperatureControl.defaultValue,
  solventProfile: Number(input.solventProfile === 1),
});
const dissolvedPercent = (temperature: number, solventProfile: number): number => {
  const temperatureRatio = clamp(temperature, 0, 80) / 80;
  return solventProfile === 0 ? 8 + 92 * temperatureRatio ** 2 : 55 + 45 * temperatureRatio ** 1.3;
};
const calculateRecrystallization = (input: RecrystallizationInput) => {
  const normalized = normalizeRecrystallizationInput(input);
  const dissolved = dissolvedPercent(normalized.coolingTemperature, normalized.solventProfile);
  return { ...normalized, hotDissolved: 100, dissolved, crystals: 100 - dissolved, crystalCount: dissolved === 100 ? 0 : Math.max(1, Math.round((100 - dissolved) / 100 * 12)) };
};
const sampleSolubilityCurve = (solventProfile: number) => Array.from({ length: 41 }, (_unused, index) => { const x = index * 2; return { x, y: dissolvedPercent(x, solventProfile) }; });
function initializeRecrystallizationModel(): void {}

export { initializeRecrystallizationModel as a, sampleSolubilityCurve as i, solventProfileControl as n, calculateRecrystallization as r, coolingTemperatureControl as t };
