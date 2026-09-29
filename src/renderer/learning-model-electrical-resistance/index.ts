// Electrical resistance learning model: R = rho L / A.
import "@rchunk/rolldown-runtime";

interface NumericControl { defaultValue: number; max: number; min: number; step: number }
interface ResistanceValues { area?: number | null; length?: number | null; resistivity?: number | null }
interface ResistanceState { area: number; length: number; resistance: number; resistivity: number }

const lengthControl: NumericControl = { min: 0.5, max: 5, step: 0.1, defaultValue: 3 };
const areaControl: NumericControl = { min: 0.5, max: 5, step: 0.1, defaultValue: 2 };
const resistivityControl: NumericControl = { min: 0.2, max: 2, step: 0.05, defaultValue: 0.8 };

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

function finiteControlValue(value: number | null | undefined, fallback: number, minimum: number, maximum: number): number {
  return Number.isFinite(value) ? clamp(value ?? fallback, minimum, maximum) : fallback;
}

function normalizeResistanceValues(values: ResistanceValues): Omit<ResistanceState, "resistance"> {
  return {
    length: finiteControlValue(values.length, lengthControl.defaultValue, lengthControl.min, lengthControl.max),
    area: finiteControlValue(values.area, areaControl.defaultValue, areaControl.min, areaControl.max),
    resistivity: finiteControlValue(values.resistivity, resistivityControl.defaultValue, resistivityControl.min, resistivityControl.max),
  };
}

function calculateResistance(values: ResistanceValues): ResistanceState {
  const normalized = normalizeResistanceValues(values);
  return { ...normalized, resistance: (normalized.resistivity * normalized.length) / normalized.area };
}

function initializeElectricalResistanceModel(): void {}

export {
  initializeElectricalResistanceModel as a,
  calculateResistance as i,
  lengthControl as n,
  normalizeResistanceValues as o,
  resistivityControl as r,
  areaControl as t,
};
