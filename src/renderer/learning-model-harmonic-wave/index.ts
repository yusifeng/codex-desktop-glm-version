// Harmonic-wave teaching model. Release chunk: model-e9f5407ef986.js.
import "@rchunk/rolldown-runtime";

interface HarmonicWaveInput { fundamentalHz?: number; harmonicMagnitude?: number }

const harmonicWaveDefaults = { fundamentalHz: 1.5, harmonicMagnitude: 0.8 };
const clampFinite = (value: number | undefined, minimum: number, maximum: number, fallback: number): number =>
  Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value as number)) : fallback;
const calculateHarmonicWave = (input: HarmonicWaveInput) => {
  const fundamentalHz = clampFinite(input.fundamentalHz, 0.5, 3, 1.5);
  const harmonicMagnitude = clampFinite(input.harmonicMagnitude, 0, 1.5, 0.8);
  return {
    fundamentalHz,
    harmonicHz: fundamentalHz * 2,
    harmonicMagnitude,
    hasHarmonic: harmonicMagnitude > 0,
  };
};
const generateSineWave = (frequencyHz: number, magnitude: number, segments = 480) =>
  Array.from({ length: segments + 1 }, (_, index) => {
    const x = index / segments * 4;
    return { x, y: magnitude * Math.sin(2 * Math.PI * frequencyHz * x) };
  });
function initializeHarmonicWaveModel(): void {}

export { generateSineWave as i, calculateHarmonicWave as n, initializeHarmonicWaveModel as r, harmonicWaveDefaults as t };
