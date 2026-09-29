// Michaelis-Menten enzyme-kinetics learning model.
import "@rchunk/rolldown-runtime";

interface NumericControl {
  defaultValue: number;
  max: number;
  min: number;
  step: number;
}

interface EnzymeKineticsValues {
  km?: number | null;
  substrateConcentration?: number | null;
  vmax?: number | null;
}

interface NormalizedEnzymeKineticsValues {
  km: number;
  substrateConcentration: number;
  vmax: number;
}

const substrateConcentrationControl: NumericControl = { min: 0, max: 20, step: 0.25, defaultValue: 6 };
const kmControl: NumericControl = { min: 1, max: 8, step: 0.25, defaultValue: 4 };
const vmaxControl: NumericControl = { min: 2, max: 10, step: 0.25, defaultValue: 8 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);

function finiteControlValue(value: number | null | undefined, control: NumericControl): number {
  return Number.isFinite(value) ? clamp(value ?? control.defaultValue, control.min, control.max) : control.defaultValue;
}

function normalizeEnzymeKineticsValues(values: EnzymeKineticsValues): NormalizedEnzymeKineticsValues {
  return {
    substrateConcentration: finiteControlValue(values.substrateConcentration, substrateConcentrationControl),
    km: finiteControlValue(values.km, kmControl),
    vmax: finiteControlValue(values.vmax, vmaxControl),
  };
}

function michaelisMentenVelocity(values: NormalizedEnzymeKineticsValues): number {
  return values.substrateConcentration === 0
    ? 0
    : values.vmax * values.substrateConcentration / (values.km + values.substrateConcentration);
}

function calculateEnzymeKinetics(values: EnzymeKineticsValues) {
  const normalized = normalizeEnzymeKineticsValues(values);
  return {
    ...normalized,
    reactionVelocity: michaelisMentenVelocity(normalized),
    halfVmax: normalized.vmax / 2,
    kmVelocity: michaelisMentenVelocity({ ...normalized, substrateConcentration: normalized.km }),
  };
}

function initializeMichaelisMentenKineticsModel(): void {}

export {
  initializeMichaelisMentenKineticsModel as a,
  calculateEnzymeKinetics as i,
  substrateConcentrationControl as n,
  normalizeEnzymeKineticsValues as o,
  vmaxControl as r,
  kmControl as t,
};
