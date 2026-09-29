// Seeded particle diffusion from an imbalanced chamber toward equal side counts.
import "@rchunk/rolldown-runtime";

type DiffusionPhase = "start" | "middle" | "equilibrium";
interface DiffusionSettings { initialLeftCount?: number | null; phase?: unknown }
interface ParticlePosition { id: number; x: number; y: number }
interface DiffusionFrame { positions: ParticlePosition[]; leftCount: number; rightCount: number }
interface DiffusionRun { seed: number; initialLeftCount: number; frames: DiffusionFrame[] }

const diffusionTimeStep = 0.05;
const defaultDiffusionSeed = 5370206;
const diffusionBounds = { left: 24, right: 360, top: 24, bottom: 258, midpoint: 192 };
const equilibriumElapsed = 16;
const particleRadius = 9;
const randomStepScale = 5.25;
const outputFrameCount = Math.round(equilibriumElapsed / diffusionTimeStep) + 1;
const simulationAttemptCount = 24;
const maximumSimulationFrames = Math.round(outputFrameCount * 1.5);
const equilibriumTailFraction = 0.8;
const equilibriumMeanDifferenceLimit = 6;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => { state += 1831565813; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
};
const gaussianRandom = (random: () => number): number => { const first = Math.max(random(), 2 ** -52); return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * random()); };
const reflect = (value: number, minimum: number, maximum: number): number => {
  const width = maximum - minimum;
  const period = width * 2;
  const offset = ((value - minimum) % period + period) % period;
  return offset <= width ? minimum + offset : maximum - (offset - width);
};
const initialParticle = (id: number, initialLeftCount: number, random: () => number): ParticlePosition => {
  const startsLeft = id < initialLeftCount;
  const xMinimum = startsLeft ? diffusionBounds.left + particleRadius : diffusionBounds.midpoint + particleRadius;
  const xMaximum = startsLeft ? diffusionBounds.midpoint - particleRadius : diffusionBounds.right - particleRadius;
  return { id, x: xMinimum + random() * (xMaximum - xMinimum), y: diffusionBounds.top + particleRadius + random() * (diffusionBounds.bottom - diffusionBounds.top - 18) };
};
const snapshot = (positions: ParticlePosition[]): DiffusionFrame => {
  const copiedPositions = positions.map((position) => ({ ...position }));
  const leftCount = copiedPositions.filter(({ x }) => x < diffusionBounds.midpoint).length;
  return { positions: copiedPositions, leftCount, rightCount: copiedPositions.length - leftCount };
};
const isStableEquilibrium = (frames: DiffusionFrame[]): boolean => {
  const tail = frames.slice(Math.floor(frames.length * equilibriumTailFraction));
  return tail.reduce((sum, frame) => sum + Math.abs(frame.leftCount - frame.rightCount), 0) / tail.length <= equilibriumMeanDifferenceLimit;
};
const downsampleFrames = (frames: DiffusionFrame[]): DiffusionFrame[] => Array.from({ length: outputFrameCount }, (_, index) => frames[Math.round(index * (frames.length - 1) / (outputFrameCount - 1))] ?? frames[0]);
const mixSeed = (seed: number, attempt: number): number => { let mixed = seed + Math.imul(attempt, 2654435769) >>> 0; mixed = Math.imul(mixed ^ mixed >>> 16, 569420461); mixed = Math.imul(mixed ^ mixed >>> 15, 1935289751); return (mixed ^ mixed >>> 15) >>> 0; };
const simulateDiffusionAttempt = (seed: number, initialLeftCount: number): DiffusionFrame[] | undefined => {
  const random = seededRandom(seed);
  let positions = Array.from({ length: 32 }, (_, id) => initialParticle(id, initialLeftCount, random));
  const frames = [snapshot(positions)];
  for (let frameIndex = 1; frameIndex < maximumSimulationFrames; frameIndex += 1) {
    positions = positions.map((position) => ({ id: position.id, x: reflect(position.x + gaussianRandom(random) * randomStepScale, diffusionBounds.left + particleRadius, diffusionBounds.right - particleRadius), y: reflect(position.y + gaussianRandom(random) * randomStepScale, diffusionBounds.top + particleRadius, diffusionBounds.bottom - particleRadius) }));
    const frame = snapshot(positions);
    frames.push(frame);
    if (frameIndex >= outputFrameCount - 1 && frame.leftCount === equilibriumElapsed) { const downsampled = downsampleFrames(frames); if (isStableEquilibrium(downsampled)) return downsampled; }
  }
  return undefined;
};
const findDiffusionRun = (seed: number, initialLeftCount: number): DiffusionFrame[] | undefined => {
  for (let attempt = 0; attempt < simulationAttemptCount; attempt += 1) { const frames = simulateDiffusionAttempt(mixSeed(seed, attempt), initialLeftCount); if (frames) return frames; }
  return undefined;
};
const normalizeInitialLeftCount = (value: number): number => Number.isFinite(value) ? clamp(Math.round(value), 20, 30) : 27;
const createDiffusionRun = (seed: number, initialLeftCount = 27): DiffusionRun => {
  const safeSeed = Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0;
  const safeInitialLeftCount = normalizeInitialLeftCount(initialLeftCount);
  const frames = findDiffusionRun(safeSeed, safeInitialLeftCount) ?? findDiffusionRun(defaultDiffusionSeed, safeInitialLeftCount);
  if (!frames) throw new Error("Diffusion run did not reach equal side counts");
  return { seed: safeSeed, initialLeftCount: safeInitialLeftCount, frames };
};
const randomDiffusionSeed = (): number => typeof crypto < "u" && "getRandomValues" in crypto ? crypto.getRandomValues(new Uint32Array(1))[0] ?? 0 : Math.floor(Math.random() * 4294967296) >>> 0;
const diffusionPhaseForElapsed = (elapsed: number): DiffusionPhase => { const progress = clamp(elapsed, 0, equilibriumElapsed) / equilibriumElapsed; return progress < 0.2 ? "start" : progress < 0.8 ? "middle" : "equilibrium"; };
const diffusionFrameAtElapsed = (run: DiffusionRun, elapsed: number): DiffusionFrame => { const index = clamp(Math.round(clamp(elapsed, 0, equilibriumElapsed) / diffusionTimeStep), 0, run.frames.length - 1); return run.frames[index] ?? run.frames[0]; };
const normalizeDiffusionSettings = (settings: DiffusionSettings) => ({ initialLeftCount: normalizeInitialLeftCount(settings.initialLeftCount ?? 27), phase: settings.phase === "middle" || settings.phase === "equilibrium" ? settings.phase : "start" as DiffusionPhase });

function initializeParticleDiffusionModel(): void {}

export { randomDiffusionSeed as a, initializeParticleDiffusionModel as c, createDiffusionRun as i, normalizeDiffusionSettings as l, diffusionTimeStep as n, diffusionFrameAtElapsed as o, defaultDiffusionSeed as r, diffusionPhaseForElapsed as s, diffusionBounds as t };
