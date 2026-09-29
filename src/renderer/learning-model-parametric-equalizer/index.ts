// Parametric-equalizer learning model: sample a bell-filter response on a log-frequency axis.
// Release chunk: app/webview/assets/model-5e953d82d89b.js.
import "@rchunk/rolldown-runtime";

interface EqualizerValues { frequencyLog?: number | null; gainDb?: number | null; q?: number | null }
interface NormalizedEqualizerValues { frequencyLog: number; gainDb: number; q: number }
interface ResponsePoint { x: number; y: number }

let minimumCenterFrequencyLog: number;
let maximumCenterFrequencyLog: number;
let frequencyLogStep: number;
let minimumQ: number;
let normalizeEqualizerValues: (values: EqualizerValues) => NormalizedEqualizerValues;
let calculateBandEdges: (centerFrequency: number, q: number) => { lowerFrequency: number; upperFrequency: number };
let sampleEqualizerResponse: (values: EqualizerValues, sampleCount?: number) => ResponsePoint[];
let initialized = false;

function initializeParametricEqualizerModel(): void {
  if (initialized) return;
  initialized = true;
  minimumCenterFrequencyLog = Math.log10(50);
  maximumCenterFrequencyLog = Math.log10(8_000);
  frequencyLogStep = (maximumCenterFrequencyLog - minimumCenterFrequencyLog) / 220;
  minimumQ = 0.5;
  const normalizeFinite = (value: number | null | undefined, minimum: number, maximum: number, fallback: number): number =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
  normalizeEqualizerValues = values => ({
    frequencyLog: normalizeFinite(values.frequencyLog, minimumCenterFrequencyLog, maximumCenterFrequencyLog, 3),
    gainDb: normalizeFinite(values.gainDb, -12, 12, 6),
    q: normalizeFinite(values.q, minimumQ, 8, 1),
  });
  calculateBandEdges = (centerFrequency, q) => {
    const reciprocalQ = 1 / q;
    const edgeRatio = (reciprocalQ + Math.sqrt(reciprocalQ ** 2 + 4)) / 2;
    return { lowerFrequency: centerFrequency / edgeRatio, upperFrequency: centerFrequency * edgeRatio };
  };
  const gainAtFrequency = (frequency: number, centerFrequency: number, gainDb: number, q: number): number => {
    if (gainDb === 0) return 0;
    const { upperFrequency } = calculateBandEdges(centerFrequency, q);
    return gainDb / (1 + (Math.log(frequency / centerFrequency) / Math.log(upperFrequency / centerFrequency)) ** 2);
  };
  sampleEqualizerResponse = (values, sampleCount = 361) => {
    const { frequencyLog, gainDb, q } = normalizeEqualizerValues(values);
    const centerFrequency = 10 ** frequencyLog;
    const { lowerFrequency, upperFrequency } = calculateBandEdges(centerFrequency, q);
    const minimumGraphFrequencyLog = Math.log10(20);
    const maximumGraphFrequencyLog = Math.log10(20_000);
    const count = Math.max(2, Math.round(sampleCount));
    return [...new Set([
      ...Array.from({ length: count }, (_unused, index) =>
        minimumGraphFrequencyLog + index / (count - 1) * (maximumGraphFrequencyLog - minimumGraphFrequencyLog)),
      frequencyLog, Math.log10(lowerFrequency), Math.log10(upperFrequency),
    ])]
      .filter(value => value >= minimumGraphFrequencyLog && value <= maximumGraphFrequencyLog)
      .sort((left, right) => left - right)
      .map(x => ({ x, y: gainAtFrequency(10 ** x, centerFrequency, gainDb, q) }));
  };
}

export {
  sampleEqualizerResponse as a, normalizeEqualizerValues as c, minimumQ as i,
  minimumCenterFrequencyLog as n, calculateBandEdges as o, frequencyLogStep as r,
  initializeParametricEqualizerModel as s, maximumCenterFrequencyLog as t,
};
