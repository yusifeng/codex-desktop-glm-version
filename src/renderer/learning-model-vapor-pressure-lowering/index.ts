// Raoult's-law learning model for vapor-pressure lowering by a nonvolatile solute.
import "@rchunk/rolldown-runtime";

interface NumericParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface VaporPressureValues { pure_solvent_vapor_pressure_kpa?: number; soluteMoleFraction?: number }
interface VaporPressureState { purePressureKpa: number; soluteFraction: number; solventFraction: number; solutionPressureKpa: number; loweringKpa: number }

let vaporPressureLoweringManifest: { type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string; parameters: { pure_solvent_vapor_pressure_kpa: NumericParameter } };
let pureSolventPressureParameter: NumericParameter;
let soluteMoleFractionControl: { defaultValue: number; min: number; max: number; step: number };
let calculateVaporPressureLowering: (values: VaporPressureValues) => VaporPressureState;
let manifestInitialized = false;
let modelInitialized = false;

function initializeVaporPressureLoweringManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  vaporPressureLoweringManifest = {
    type: "VAPOR_PRESSURE_LOWERING", version: 1, thumbnailAssetKey: "vapor-pressure-lowering-v1",
    canonicalFormula: "P_{\\mathrm{solution}}=X_{\\mathrm{solvent}}P^\\circ_{\\mathrm{solvent}}",
    parameters: { pure_solvent_vapor_pressure_kpa: { kind: "number", defaultValue: 100, min: 10, max: 200 } },
  };
}

function initializeVaporPressureLoweringModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeVaporPressureLoweringManifest();
  pureSolventPressureParameter = vaporPressureLoweringManifest.parameters.pure_solvent_vapor_pressure_kpa;
  soluteMoleFractionControl = { defaultValue: 0.4, min: 0, max: 1, step: 0.01 };
  const finiteOr = (value: number | undefined, fallback: number): number => Number.isFinite(value) ? value as number : fallback;
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  calculateVaporPressureLowering = values => {
    const purePressureKpa = clamp(finiteOr(values.pure_solvent_vapor_pressure_kpa, pureSolventPressureParameter.defaultValue), pureSolventPressureParameter.min, pureSolventPressureParameter.max);
    const soluteFraction = clamp(finiteOr(values.soluteMoleFraction, soluteMoleFractionControl.defaultValue), soluteMoleFractionControl.min, soluteMoleFractionControl.max);
    const solventFraction = 1 - soluteFraction;
    return { purePressureKpa, soluteFraction, solventFraction, solutionPressureKpa: solventFraction * purePressureKpa, loweringKpa: soluteFraction * purePressureKpa };
  };
}

export { initializeVaporPressureLoweringManifest as a, initializeVaporPressureLoweringModel as i, soluteMoleFractionControl as n, vaporPressureLoweringManifest as o, calculateVaporPressureLowering as r, pureSolventPressureParameter as t };
