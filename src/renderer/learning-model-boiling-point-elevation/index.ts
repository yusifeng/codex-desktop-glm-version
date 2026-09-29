// Boiling-point elevation learning model using Raoult and Antoine relations.
import "@rchunk/rolldown-runtime";

type Solvent = "water" | "benzene";
interface BoilingPointValues { solvent?: unknown; initial_solute_molality?: number | null; initial_particle_factor?: number | null }

const boilingPointElevationType = "BOILING_POINT_ELEVATION";
const boilingPointElevationThumbnail = "boiling-point-elevation-v1";
const boilingPointElevationFormula = "\\Delta T_b=iK_bm";
const boilingPointElevationParameters = {
  solvent: { kind: "enum", defaultValue: "benzene" as Solvent, allowedValues: ["water", "benzene"] as Solvent[] },
  initial_solute_molality: { kind: "number", defaultValue: 0.15, min: 0, max: 0.25 },
  initial_particle_factor: { kind: "integer", defaultValue: 2, min: 1, max: 3 },
};
const boilingPointElevationDefinition = { type: boilingPointElevationType, version: 2, thumbnailAssetKey: boilingPointElevationThumbnail, canonicalFormula: boilingPointElevationFormula, parameters: boilingPointElevationParameters };
const solventProperties: Record<Solvent, { boilingPointCelsius: number; boilingPointConstant: number; molesPerKilogram: number; antoineB: number; antoineC: number }> = {
  water: { boilingPointCelsius: 100, boilingPointConstant: 0.512, molesPerKilogram: 55.51, antoineB: 1730.63, antoineC: 233.426 },
  benzene: { boilingPointCelsius: 80.1, boilingPointConstant: 2.53, molesPerKilogram: 12.8, antoineB: 1211.033, antoineC: 220.79 },
};
const parameters = boilingPointElevationDefinition.parameters;
const molalityControl = { min: parameters.initial_solute_molality.min, max: parameters.initial_solute_molality.max, step: 0.01, defaultValue: parameters.initial_solute_molality.defaultValue };
const particleFactorControl = { min: parameters.initial_particle_factor.min, max: parameters.initial_particle_factor.max, step: 1, defaultValue: parameters.initial_particle_factor.defaultValue };
const defaultSolvent = parameters.solvent.defaultValue;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeBoilingPointValues = (values: BoilingPointValues) => ({
  solvent: values.solvent === "water" || values.solvent === "benzene" ? values.solvent : defaultSolvent,
  initial_solute_molality: Number.isFinite(values.initial_solute_molality) ? clamp(values.initial_solute_molality ?? molalityControl.defaultValue, molalityControl.min, molalityControl.max) : molalityControl.defaultValue,
  initial_particle_factor: Number.isFinite(values.initial_particle_factor) ? clamp(Math.round(values.initial_particle_factor ?? particleFactorControl.defaultValue), particleFactorControl.min, particleFactorControl.max) : particleFactorControl.defaultValue,
});

function deriveBoilingPointElevation(values: BoilingPointValues) {
  const normalized = normalizeBoilingPointValues(values);
  const properties = solventProperties[normalized.solvent];
  const particleMolality = normalized.initial_solute_molality * normalized.initial_particle_factor;
  const solventMoleFraction = properties.molesPerKilogram / (properties.molesPerKilogram + particleMolality);
  const referenceAntoineValue = properties.antoineB / (properties.antoineC + properties.boilingPointCelsius);
  const solutionBoilingPointCelsius = properties.antoineB / (referenceAntoineValue - Math.log10(1 / solventMoleFraction)) - properties.antoineC;
  return {
    ...normalized,
    pureBoilingPointCelsius: properties.boilingPointCelsius,
    solutionBoilingPointCelsius,
    boilingPointConstant: properties.boilingPointConstant,
    particleMolality,
    deltaBoilingPointCelsius: solutionBoilingPointCelsius - properties.boilingPointCelsius,
    diluteEstimateCelsius: properties.boilingPointConstant * particleMolality,
    solventMoleFraction,
  };
}

const relativeVaporPressure = (temperatureCelsius: number, solvent: Solvent): number => {
  const properties = solventProperties[solvent];
  return 10 ** (properties.antoineB / (properties.antoineC + properties.boilingPointCelsius) - properties.antoineB / (properties.antoineC + temperatureCelsius));
};
const solutionRelativeVaporPressure = (temperatureCelsius: number, state: ReturnType<typeof deriveBoilingPointElevation>): number => relativeVaporPressure(temperatureCelsius, state.solvent) * state.solventMoleFraction;
function initializeBoilingPointElevationSchema(): void {}
function initializeBoilingPointElevationModel(): void {}

export {
  initializeBoilingPointElevationModel as a,
  relativeVaporPressure as c,
  deriveBoilingPointElevation as i,
  initializeBoilingPointElevationSchema as l,
  particleFactorControl as n,
  normalizeBoilingPointValues as o,
  defaultSolvent as r,
  solutionRelativeVaporPressure as s,
  molalityControl as t,
  boilingPointElevationDefinition as u,
};
