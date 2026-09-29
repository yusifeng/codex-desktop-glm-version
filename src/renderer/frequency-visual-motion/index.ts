import "@rchunk/rolldown-runtime";

interface FrequencyMotion {
  phaseSpeed: number;
  visibleCycles: number;
}
interface FrequencyStop {
  frequency: number;
  visibleCycles: number;
}

let stops: readonly FrequencyStop[];
let minimumFrequency: number;
let maximumFrequency: number;
let minimumPhaseSpeed: number;
let maximumPhaseSpeed: number;
let circle: number;

function initializeFrequencyVisualMotion(): void {
  if (stops != null) return;
  stops = [
    { frequency: 0.001, visibleCycles: 1.2 },
    { frequency: 0.25, visibleCycles: 1.9 },
    { frequency: 2, visibleCycles: 3.8 },
    { frequency: 4, visibleCycles: 4.2 },
    { frequency: 100, visibleCycles: 5.6 },
    { frequency: 1000, visibleCycles: 6.2 },
  ];
  circle = Math.PI * 2;
  minimumFrequency = 0.25;
  maximumFrequency = 4;
  minimumPhaseSpeed = 0.35;
  maximumPhaseSpeed = circle * 6;
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
function phaseSpeedForFrequency(frequency: number): number {
  if (frequency < minimumFrequency) {
    const progress = Math.log(frequency / stops[0].frequency) / Math.log(minimumFrequency / stops[0].frequency);
    return interpolate(minimumPhaseSpeed, circle * minimumFrequency, progress);
  }
  if (frequency <= maximumFrequency) return circle * frequency;
  const progress = Math.min(Math.log(frequency / maximumFrequency) / Math.log(1000 / maximumFrequency), 1);
  return interpolate(circle * maximumFrequency, maximumPhaseSpeed, progress);
}
function getFrequencyVisualMotion(frequency: number): FrequencyMotion {
  initializeFrequencyVisualMotion();
  const first = stops[0];
  const last = stops.at(-1) ?? first;
  const normalized = Number.isFinite(frequency) ? Math.max(frequency, first.frequency) : frequency > 0 ? last.frequency : first.frequency;
  let visibleCycles = first.visibleCycles;
  for (let index = 1; index < stops.length; index += 1) {
    const previous = stops[index - 1];
    const next = stops[index];
    if (normalized > next.frequency) continue;
    const progress = Math.log(normalized / previous.frequency) / Math.log(next.frequency / previous.frequency);
    visibleCycles = interpolate(previous.visibleCycles, next.visibleCycles, progress);
    break;
  }
  if (normalized >= last.frequency) visibleCycles = last.visibleCycles;
  return { phaseSpeed: phaseSpeedForFrequency(normalized), visibleCycles };
}

initializeFrequencyVisualMotion();

export { initializeFrequencyVisualMotion as n, getFrequencyVisualMotion as t };
