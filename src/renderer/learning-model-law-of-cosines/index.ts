// Law-of-cosines learning model for two sides and their included angle.
import "@rchunk/rolldown-runtime";

interface NumericControl { min: number; max: number; step: number }
interface TriangleValues { sideA?: number; sideB?: number; angleDeg?: number }
interface TriangleState { sideA: number; sideB: number; angleDeg: number; angleRad: number; origin: { x: number; y: number }; endpointA: { x: number; y: number }; endpointB: { x: number; y: number }; sideC: number; sideCSquared: number }

let sideControl: NumericControl;
let angleControl: NumericControl;
let defaultTriangleValues: { sideA: number; sideB: number; angleDeg: number };
let normalizeTriangleValues: (values: TriangleValues) => { sideA: number; sideB: number; angleDeg: number };
let radiansToDegrees: (radians: number) => number;
let calculateLawOfCosines: (values: TriangleValues) => TriangleState;
let initialized = false;

function initializeLawOfCosinesModel(): void {
  if (initialized) return;
  initialized = true;
  sideControl = { min: 2, max: 7, step: 0.5 };
  angleControl = { min: 20, max: 160, step: 1 };
  defaultTriangleValues = { sideA: 5, sideB: 6, angleDeg: 120 };
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  const snap = (value: number, step: number): number => Number((Math.round(value / step) * step).toFixed(6));
  const normalizeControl = (value: number | undefined, control: NumericControl, fallback: number): number => clamp(snap(typeof value === "number" && Number.isFinite(value) ? value : fallback, control.step), control.min, control.max);
  normalizeTriangleValues = values => ({ sideA: normalizeControl(values.sideA, sideControl, defaultTriangleValues.sideA), sideB: normalizeControl(values.sideB, sideControl, defaultTriangleValues.sideB), angleDeg: normalizeControl(values.angleDeg, angleControl, defaultTriangleValues.angleDeg) });
  const degreesToRadians = (degrees: number): number => degrees * Math.PI / 180;
  radiansToDegrees = radians => radians * 180 / Math.PI;
  calculateLawOfCosines = values => {
    const normalized = normalizeTriangleValues(values);
    const angleRad = degreesToRadians(normalized.angleDeg);
    const endpointA = { x: normalized.sideA, y: 0 };
    const endpointB = { x: normalized.sideB * Math.cos(angleRad), y: normalized.sideB * Math.sin(angleRad) };
    const sideCSquared = normalized.sideA ** 2 + normalized.sideB ** 2 - 2 * normalized.sideA * normalized.sideB * Math.cos(angleRad);
    return { ...normalized, angleRad, origin: { x: 0, y: 0 }, endpointA, endpointB, sideC: Math.sqrt(Math.max(0, sideCSquared)), sideCSquared };
  };
}

export { radiansToDegrees as a, initializeLawOfCosinesModel as i, defaultTriangleValues as n, normalizeTriangleValues as o, sideControl as r, calculateLawOfCosines as s, angleControl as t };
