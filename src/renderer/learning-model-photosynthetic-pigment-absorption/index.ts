// Photosynthetic-pigment absorption-spectrum model. Release chunk: model-c52682da7ea4.js.
import "@rchunk/rolldown-runtime";

type Pigment = "chlorophyllA" | "chlorophyllB" | "carotenoids";
interface PigmentInput { wavelength?: number; focus?: number }

const wavelengthControl = { min: 400, max: 700, step: 5, defaultValue: 550 };
const focusControl = { min: 0, max: 3, step: 1, defaultValue: 0 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const gaussianPeak = (value: number, center: number, spread: number): number => Math.exp(-0.5 * ((value - center) / spread) ** 2);
const normalizePigmentInput = (input: PigmentInput) => ({
  wavelength: typeof input.wavelength === "number" && Number.isFinite(input.wavelength) ? clamp(input.wavelength, wavelengthControl.min, wavelengthControl.max) : wavelengthControl.defaultValue,
  focus: typeof input.focus === "number" && Number.isFinite(input.focus) ? clamp(Math.round(input.focus), focusControl.min, focusControl.max) : focusControl.defaultValue,
});
const calculatePigmentAbsorption = (wavelength: number) => {
  const safeWavelength = clamp(wavelength, wavelengthControl.min, wavelengthControl.max);
  return {
    chlorophyllA: Math.min(1, 0.03 + 0.93 * gaussianPeak(safeWavelength, 430, 13) + 0.82 * gaussianPeak(safeWavelength, 665, 14)),
    chlorophyllB: Math.min(1, 0.025 + 0.84 * gaussianPeak(safeWavelength, 455, 15) + 0.65 * gaussianPeak(safeWavelength, 645, 13)),
    carotenoids: Math.min(1, 0.015 + 0.3 * gaussianPeak(safeWavelength, 420, 30) + 0.63 * gaussianPeak(safeWavelength, 475, 22)),
  };
};
const visibleColorBand = (wavelength: number): string => wavelength < 450 ? "violet-blue" : wavelength < 500 ? "blue" : wavelength < 570 ? "green" : wavelength < 600 ? "yellow" : wavelength < 630 ? "orange" : "red";
const samplePigmentSpectrum = (pigment: Pigment) => Array.from({ length: 151 }, (_unused, index) => {
  const wavelength = wavelengthControl.min + index * 2;
  return { x: wavelength, y: calculatePigmentAbsorption(wavelength)[pigment] };
});
function initializePigmentAbsorptionModel(): void {}

export { initializePigmentAbsorptionModel as a, visibleColorBand as i, wavelengthControl as n, samplePigmentSpectrum as o, calculatePigmentAbsorption as r, normalizePigmentInput as s, focusControl as t };
