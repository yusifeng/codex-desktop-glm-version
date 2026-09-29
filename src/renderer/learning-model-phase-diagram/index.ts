// Pressure-temperature phase diagram with triple and critical points.
import "@rchunk/rolldown-runtime";

interface PhaseDiagramValues { temperature?: number | null; pressure?: number | null }

const phaseDiagramControl = { min: 0, max: 100, step: 1 };
const triplePoint = { temperature: 30, pressure: 25 };
const criticalPoint = { temperature: 82, pressure: 78 };
const defaultPhasePoint = { temperature: 56, pressure: 54 };
const boundaryTolerance = 0.75;
const clamp = (value: number): number => Math.min(phaseDiagramControl.max, Math.max(phaseDiagramControl.min, value));
const normalizeNumber = (value: number | null | undefined, defaultValue: number): number => Number.isFinite(value) ? clamp(value ?? defaultValue) : defaultValue;
const normalizePhasePoint = (values: PhaseDiagramValues) => ({ temperature: normalizeNumber(values.temperature, defaultPhasePoint.temperature), pressure: normalizeNumber(values.pressure, defaultPhasePoint.pressure) });
const sublimationBoundary = (temperature: number): number => 2 + (triplePoint.pressure - 2) * (Math.max(0, temperature) / triplePoint.temperature) ** 0.82;
const vaporizationBoundary = (temperature: number): number => triplePoint.pressure + (criticalPoint.pressure - triplePoint.pressure) * (Math.max(0, temperature - triplePoint.temperature) / (criticalPoint.temperature - triplePoint.temperature)) ** 1.65;
const meltingBoundary = (pressure: number): number => triplePoint.temperature + (pressure - triplePoint.pressure) * 0.075;
const minimumSublimationPressure = sublimationBoundary(phaseDiagramControl.min);
const maximumMeltingTemperature = meltingBoundary(phaseDiagramControl.max);
const near = (left: number, right: number): boolean => Math.abs(left - right) <= boundaryTolerance;
const phaseAtPoint = (values: PhaseDiagramValues): string => {
  const { temperature, pressure } = normalizePhasePoint(values);
  if (near(temperature, triplePoint.temperature) && near(pressure, triplePoint.pressure)) return "triple";
  if (near(temperature, criticalPoint.temperature) && near(pressure, criticalPoint.pressure)) return "critical";
  if (temperature < triplePoint.temperature) { const boundary = sublimationBoundary(temperature); return near(pressure, boundary) ? "solid-gas" : pressure > boundary ? "solid" : "gas"; }
  if (pressure >= triplePoint.pressure && near(temperature, meltingBoundary(pressure))) return "solid-liquid";
  if (pressure >= triplePoint.pressure && temperature < meltingBoundary(pressure)) return "solid";
  if (temperature <= criticalPoint.temperature) { const boundary = vaporizationBoundary(temperature); return near(pressure, boundary) ? "liquid-gas" : pressure > boundary ? "liquid" : "gas"; }
  return pressure >= criticalPoint.pressure ? "supercritical" : "gas";
};
const processAtConstantPressure = (pressure: number): string => {
  const safePressure = normalizeNumber(pressure, defaultPhasePoint.pressure);
  return safePressure < minimumSublimationPressure ? "gas-only" : safePressure < triplePoint.pressure ? "sublimation" : safePressure === triplePoint.pressure ? "triple" : safePressure < criticalPoint.pressure ? "melting-vaporization" : safePressure === criticalPoint.pressure ? "melting-critical" : "melting-supercritical";
};
const processAtConstantTemperature = (temperature: number): string => {
  const safeTemperature = normalizeNumber(temperature, defaultPhasePoint.temperature);
  return safeTemperature < triplePoint.temperature ? "deposition" : safeTemperature === triplePoint.temperature ? "triple" : safeTemperature <= maximumMeltingTemperature ? "condensation-freezing" : safeTemperature < criticalPoint.temperature ? "condensation" : safeTemperature === criticalPoint.temperature ? "critical" : "supercritical";
};
const sampleBoundary = (start: number, end: number, boundary: (value: number) => number, segments = 36) => Array.from({ length: segments + 1 }, (_unused, index) => { const x = start + (end - start) * index / segments; return { x, y: boundary(x) }; });

function initializePhaseDiagramModel(): void {}

export { meltingBoundary as a, phaseAtPoint as c, normalizePhasePoint as d, sublimationBoundary as f, triplePoint as i, initializePhaseDiagramModel as l, defaultPhasePoint as n, processAtConstantTemperature as o, vaporizationBoundary as p, phaseDiagramControl as r, processAtConstantPressure as s, criticalPoint as t, sampleBoundary as u };
