// Radiometric-dating learning model across three isotope systems.
import "@rchunk/rolldown-runtime";

type IsotopeSystem = "carbon-14-to-nitrogen-14" | "potassium-40-to-argon-40" | "uranium-238-to-lead-206";
interface RadiometricDatingValues { isotope_system?: string | null; elapsedHalfLives?: number | null }

const radiometricDatingType = "RADIOMETRIC_DATING";
const radiometricDatingThumbnail = "radiometric-dating-v1";
const radiometricDatingParameters = { isotope_system: { kind: "enum", defaultValue: "carbon-14-to-nitrogen-14" as IsotopeSystem, allowedValues: ["carbon-14-to-nitrogen-14", "potassium-40-to-argon-40", "uranium-238-to-lead-206"] as IsotopeSystem[] } };
const radiometricDatingDefinition = { type: radiometricDatingType, version: 2, thumbnailAssetKey: radiometricDatingThumbnail, parameters: radiometricDatingParameters };
const elapsedHalfLivesControl = { min: 0, max: 4, step: 1, defaultValue: 2 };
const defaultIsotopeSystem = radiometricDatingDefinition.parameters.isotope_system.defaultValue;
const terrestrialAgeLimitYears = 4.6e9;
const isotopeSystems: Record<IsotopeSystem, { parentSymbol: string; convertedSymbol: string; convertedKind: string; materialKind: string; halfLifeYears: number }> = {
  "carbon-14-to-nitrogen-14": { parentSymbol: "C-14", convertedSymbol: "C-14", convertedKind: "decayed", materialKind: "once-living", halfLifeYears: 5730 },
  "potassium-40-to-argon-40": { parentSymbol: "K-40", convertedSymbol: "Ca-40 + Ar-40", convertedKind: "total-daughters", materialKind: "volcanic", halfLifeYears: 1.25e9 },
  "uranium-238-to-lead-206": { parentSymbol: "U-238", convertedSymbol: "Pb-206", convertedKind: "daughter", materialKind: "zircon", halfLifeYears: 4.47e9 },
};
const isotopeSystemNames = Object.keys(isotopeSystems) as IsotopeSystem[];
const halfLifeMilestones = [
  { elapsedHalfLives: 0, parentPercent: 100, daughterPercent: 0 }, { elapsedHalfLives: 1, parentPercent: 50, daughterPercent: 50 },
  { elapsedHalfLives: 2, parentPercent: 25, daughterPercent: 75 }, { elapsedHalfLives: 3, parentPercent: 12.5, daughterPercent: 87.5 },
  { elapsedHalfLives: 4, parentPercent: 6.25, daughterPercent: 93.75 },
];
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const parentPercentAfter = (halfLives: number): number => 100 * 2 ** -halfLives;
const daughterPercentAfter = (halfLives: number): number => 100 - parentPercentAfter(halfLives);
const normalizeRadiometricDatingValues = (values: RadiometricDatingValues) => ({
  isotope_system: isotopeSystemNames.includes(values.isotope_system as IsotopeSystem) ? values.isotope_system as IsotopeSystem : defaultIsotopeSystem,
  elapsedHalfLives: Number.isFinite(values.elapsedHalfLives) ? clamp(Math.round(values.elapsedHalfLives as number), elapsedHalfLivesControl.min, elapsedHalfLivesControl.max) : elapsedHalfLivesControl.defaultValue,
});
const deriveRadiometricDatingState = (values: RadiometricDatingValues) => {
  const normalized = normalizeRadiometricDatingValues(values);
  const milestone = halfLifeMilestones[normalized.elapsedHalfLives] ?? halfLifeMilestones[elapsedHalfLivesControl.defaultValue];
  const isotope = isotopeSystems[normalized.isotope_system];
  const ageYears = normalized.elapsedHalfLives * isotope.halfLifeYears;
  return { ...normalized, ...milestone, ...isotope, ageYears, isBeyondTerrestrialRange: ageYears > terrestrialAgeLimitYears };
};

function initializeRadiometricDatingSchema(): void {}
function initializeRadiometricDatingModel(): void {}

export {
  deriveRadiometricDatingState as a,
  parentPercentAfter as c,
  radiometricDatingDefinition as d,
  defaultIsotopeSystem as i,
  normalizeRadiometricDatingValues as l,
  elapsedHalfLivesControl as n,
  daughterPercentAfter as o,
  isotopeSystemNames as r,
  initializeRadiometricDatingModel as s,
  halfLifeMilestones as t,
  initializeRadiometricDatingSchema as u,
};
