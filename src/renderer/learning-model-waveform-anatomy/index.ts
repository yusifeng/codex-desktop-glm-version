// Waveform anatomy learning model: normalize wave controls and sample one cosine trace.
import "@rchunk/rolldown-runtime";

interface WaveformValues {
  amplitude?: number | null;
  domain?: number | null;
  repeat?: number | null;
}

interface WaveformState {
  amplitude: number;
  domain: number;
  firstCrest: number;
  frequency: number;
  repeat: number;
  secondCrest: number;
  trough: number;
}

interface WaveformPoint { x: number; y: number }

const defaultWaveformValues = { domain: 0, amplitude: 1.4, repeat: 4 };

function clampFinite(value: number | null | undefined, minimum: number, maximum: number, fallback: number): number {
  return Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value as number))
    : fallback;
}

function normalizeWaveformValues(values: WaveformValues): WaveformState {
  const domain = Number(values.domain === 1);
  const amplitude = clampFinite(values.amplitude, 0.8, 2, 1.4);
  const repeat = clampFinite(values.repeat, 2, 6, 4);
  return {
    domain,
    amplitude,
    repeat,
    firstCrest: 2,
    trough: 2 + repeat / 2,
    secondCrest: 2 + repeat,
    frequency: 1 / repeat,
  };
}

function sampleWaveform(state: WaveformState): WaveformPoint[] {
  return Array.from({ length: 241 }, (_unused, index) => {
    const x = index / 20;
    return {
      x,
      y: state.amplitude * Math.cos((2 * Math.PI * (x - state.firstCrest)) / state.repeat),
    };
  });
}

function initializeWaveformAnatomyModel(): void {}

export {
  initializeWaveformAnatomyModel as i,
  normalizeWaveformValues as n,
  sampleWaveform as r,
  defaultWaveformValues as t,
};
