// Stoichiometric mole ratios for forming water from hydrogen and oxygen.
import "@rchunk/rolldown-runtime";

type Species = "h2" | "o2" | "h2o";
interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface StoichiometricValues { reactionExtentMoles?: unknown; selectedSpecies?: unknown }

const stoichiometricMoleRatiosType = "STOICHIOMETRIC_MOLE_RATIOS";
const stoichiometricMoleRatiosThumbnail = "stoichiometric-mole-ratios-v1";
const stoichiometricReaction = "2\\mathrm{H_2} + \\mathrm{O_2} \\rightarrow 2\\mathrm{H_2O}";
const stoichiometricParameters: { reactionExtentMoles: NumberParameter } = {
  reactionExtentMoles: { kind: "number", defaultValue: 1, min: 0.5, max: 5 },
};
const stoichiometricMoleRatiosSpecification = { type: stoichiometricMoleRatiosType, version: 2, thumbnailAssetKey: stoichiometricMoleRatiosThumbnail, canonicalFormula: stoichiometricReaction, parameters: stoichiometricParameters };
const species: Species[] = ["h2", "o2", "h2o"];
const speciesMetadata: Record<Species, { coefficient: number; formula: string }> = {
  h2: { coefficient: 2, formula: "H₂" },
  o2: { coefficient: 1, formula: "O₂" },
  h2o: { coefficient: 2, formula: "H₂O" },
};
const reactionExtentParameter = stoichiometricMoleRatiosSpecification.parameters.reactionExtentMoles;
const defaultSpecies: Species = "h2";
const reactionExtentControl = { min: reactionExtentParameter.min, max: reactionExtentParameter.max, step: 0.5 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const isSpecies = (value: unknown): value is Species => typeof value === "string" && species.includes(value as Species);
const normalizeStoichiometricValues = (values: StoichiometricValues) => {
  const extent = Number(values.reactionExtentMoles);
  return {
    reactionExtentMoles: Number.isFinite(extent) ? clamp(extent, reactionExtentParameter.min, reactionExtentParameter.max) : reactionExtentParameter.defaultValue,
    selectedSpecies: isSpecies(values.selectedSpecies) ? values.selectedSpecies : defaultSpecies,
  };
};
const molesForSpecies = (selectedSpecies: Species, reactionExtentMoles: number): number => speciesMetadata[selectedSpecies].coefficient * reactionExtentMoles;
const speciesAmounts = (reactionExtentMoles: number): Record<Species, number> => ({
  h2: molesForSpecies("h2", reactionExtentMoles),
  o2: molesForSpecies("o2", reactionExtentMoles),
  h2o: molesForSpecies("h2o", reactionExtentMoles),
});
const controlForSpecies = (selectedSpecies: Species) => {
  const coefficient = speciesMetadata[selectedSpecies].coefficient;
  return { min: reactionExtentControl.min * coefficient, max: reactionExtentControl.max * coefficient, step: reactionExtentControl.step * coefficient };
};
const reactionExtentFromMoles = (selectedSpecies: Species, moles: number): number => moles / speciesMetadata[selectedSpecies].coefficient;

function initializeStoichiometricMoleRatiosSpecification(): void {}
function initializeStoichiometricMoleRatiosModel(): void {}

export { reactionExtentFromMoles as a, initializeStoichiometricMoleRatiosSpecification as c, speciesAmounts as i, stoichiometricMoleRatiosSpecification as l, species as n, initializeStoichiometricMoleRatiosModel as o, controlForSpecies as r, normalizeStoichiometricValues as s, speciesMetadata as t };
