// Magnet-induced-current model: estimate galvanometer response from changing magnetic flux.
import "@rchunk/rolldown-runtime";

type MotionMode = "automatic" | "manual";
interface MagnetInput { magnetPosition?: number; motionMode?: string; playbackRevision?: number }

const magnetPositionControl = { min: 62, max: 304, defaultValue: 82 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeMagnetPosition = (value: number | undefined): number => clamp(typeof value === "number" && Number.isFinite(value) ? value : magnetPositionControl.defaultValue, magnetPositionControl.min, magnetPositionControl.max);
const normalizeMotionMode = (value: string | undefined): MotionMode => value === "automatic" ? "automatic" : "manual";
const normalizeRevision = (value: number | undefined): number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
const normalizeMagnetInput = (input: MagnetInput) => ({ magnetPosition: normalizeMagnetPosition(input.magnetPosition), motionMode: normalizeMotionMode(input.motionMode), playbackRevision: normalizeRevision(input.playbackRevision) });
const magneticFlux = (position: number): number => { const offset = position - 230; return Math.exp(-(offset * offset) / 2888); };
const inducedCurrent = (position: number, velocity: number): number => {
  if (!Number.isFinite(velocity) || Math.abs(velocity) < 0.5) return 0;
  const normalizedPosition = normalizeMagnetPosition(position);
  const offset = normalizedPosition - 230;
  const current = -(-offset / 1444 * magneticFlux(normalizedPosition)) * velocity;
  return Math.abs(current) < 0.035 ? 0 : clamp(current, -1, 1);
};
const currentDirection = (current: number): "right" | "left" | "none" => current > 0 ? "right" : current < 0 ? "left" : "none";
function initializeMagnetInducedCurrentModel(): void {}

export { initializeMagnetInducedCurrentModel as a, currentDirection as i, inducedCurrent as n, normalizeMagnetInput as o, clamp as r, normalizeMotionMode as s, magnetPositionControl as t };
