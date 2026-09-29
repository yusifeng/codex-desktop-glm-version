// Molarity teaching model. Release chunk: model-df6cdf0cba2f.js.
import "@rchunk/rolldown-runtime";

interface MolarityInput { moles?: number; volumeLiters?: number }

const molesControl = { variable: "n", unit: "mol", min: 0.1, max: 2, step: 0.05, defaultValue: 1.2 };
const volumeControl = { variable: "V", unit: "L", min: 0.5, max: 2, step: 0.05, defaultValue: 0.8 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeFinite = (value: number | undefined, fallback: number, minimum: number, maximum: number): number =>
  Number.isFinite(value) ? clamp(value ?? fallback, minimum, maximum) : fallback;
const normalizeMolarityInput = (input: MolarityInput) => ({
  moles: normalizeFinite(input.moles, molesControl.defaultValue, molesControl.min, molesControl.max),
  volumeLiters: normalizeFinite(input.volumeLiters, volumeControl.defaultValue, volumeControl.min, volumeControl.max),
});
const calculateMolarity = (input: MolarityInput) => {
  const normalized = normalizeMolarityInput(input);
  return { ...normalized, molarity: normalized.moles / normalized.volumeLiters, volumeMilliliters: normalized.volumeLiters * 1e3 };
};
function initializeMolarityModel(): void {}

export { normalizeMolarityInput as a, initializeMolarityModel as i, volumeControl as n, calculateMolarity as r, molesControl as t };
