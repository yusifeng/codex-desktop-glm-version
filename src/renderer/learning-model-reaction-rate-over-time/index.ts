// Reaction-rate-over-time learning model using concentration tangents.
import "@rchunk/rolldown-runtime";

type ObservedSpecies = "reactant" | "product";
interface ReactionRateValues { observed_species?: unknown; selectedTimeMinutes?: number | null }

const reactionRateType = "REACTION_RATE_OVER_TIME";
const reactionRateThumbnail = "reaction-rate-over-time-v1";
const reactionRateParameters = { observed_species: { kind: "enum", defaultValue: "reactant" as ObservedSpecies, allowedValues: ["reactant", "product"] as ObservedSpecies[] } };
const reactionRateDefinition = { type: reactionRateType, version: 3, thumbnailAssetKey: reactionRateThumbnail, parameters: reactionRateParameters };
const observedSpeciesParameter = reactionRateDefinition.parameters.observed_species;
const maximumTime = 20;
const timeConstant = 7;
const guideRun = 2;
const tangentRun = 4;
const selectedTimeControl = { min: 0, max: maximumTime, step: 0.5, defaultValue: 5 };
const defaultReactionRateValues = { observed_species: observedSpeciesParameter.defaultValue, selectedTimeMinutes: selectedTimeControl.defaultValue };
const isObservedSpecies = (value: unknown): value is ObservedSpecies => value === "reactant" || value === "product";
const finiteOr = (value: number | null | undefined, fallback: number): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const concentrationAt = (species: ObservedSpecies, time: number): number => {
  const remainingReactant = Math.exp(-time / timeConstant);
  return species === "reactant" ? remainingReactant : 1 - remainingReactant;
};
const normalizeReactionRateValues = (values: ReactionRateValues) => ({
  observed_species: isObservedSpecies(values.observed_species) ? values.observed_species : defaultReactionRateValues.observed_species,
  selectedTimeMinutes: Math.min(selectedTimeControl.max, Math.max(selectedTimeControl.min, finiteOr(values.selectedTimeMinutes, defaultReactionRateValues.selectedTimeMinutes))),
});
const buildReactionConcentrationCurve = (species: ObservedSpecies) => Array.from({ length: 81 }, (_unused, index) => {
  const time = maximumTime * index / 80;
  return { x: time, y: concentrationAt(species, time) };
});

function deriveReactionRateState(values: ReactionRateValues) {
  const normalized = normalizeReactionRateValues(values);
  const selectedTime = normalized.selectedTimeMinutes;
  const concentration = concentrationAt(normalized.observed_species, selectedTime);
  const rateMagnitude = Math.exp(-selectedTime / timeConstant) / timeConstant;
  const signedGradient = normalized.observed_species === "reactant" ? -rateMagnitude : rateMagnitude;
  const tangentAt = (time: number): number => concentration + signedGradient * (time - selectedTime);
  const segmentStart = (run: number): number => Math.min(Math.max(selectedTime - run / 2, selectedTimeControl.min), selectedTimeControl.max - run);
  const tangentStartTime = segmentStart(tangentRun);
  const guideStartTime = segmentStart(guideRun);
  const tangentStart = { x: tangentStartTime, y: tangentAt(tangentStartTime) };
  const tangentEnd = { x: tangentStartTime + tangentRun, y: tangentAt(tangentStartTime + tangentRun) };
  const guideStart = { x: guideStartTime, y: tangentAt(guideStartTime) };
  const guideEnd = { x: guideStartTime + guideRun, y: tangentAt(guideStartTime + guideRun) };
  return { values: normalized, concentration, rateMagnitude, signedGradient, tangentStart, tangentEnd, guideStart, guideEnd, guideRun, guideRise: guideEnd.y - guideStart.y };
}

function initializeReactionRateSchema(): void {}
function initializeReactionRateModel(): void {}

export {
  initializeReactionRateModel as a,
  buildReactionConcentrationCurve as i,
  selectedTimeControl as n,
  initializeReactionRateSchema as o,
  deriveReactionRateState as r,
  reactionRateDefinition as s,
  defaultReactionRateValues as t,
};
