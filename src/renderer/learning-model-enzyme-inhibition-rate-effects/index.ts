// Enzyme-inhibition rate-effects learning model.
import "@rchunk/rolldown-runtime";

type InhibitorLevel = "none" | "low" | "high";
type InhibitionCurve = "uninhibited" | "competitive" | "noncompetitive";
interface EnzymeInhibitionValues { relativeSubstrateConcentration?: number | null; inhibitorLevel?: string | null }

const enzymeInhibitionType = "ENZYME_INHIBITION_RATE_EFFECTS";
const enzymeInhibitionThumbnail = "enzyme-inhibition-rate-effects-v2";
const enzymeInhibitionParameters = {
  relativeSubstrateConcentration: { kind: "number", defaultValue: 2, min: 0, max: 10 },
  inhibitorLevel: { kind: "enum", defaultValue: "low" as InhibitorLevel, allowedValues: ["none", "low", "high"] as InhibitorLevel[] },
};
const enzymeInhibitionDefinition = { type: enzymeInhibitionType, version: 1, thumbnailAssetKey: enzymeInhibitionThumbnail, parameters: enzymeInhibitionParameters };
const substrateControl = { ...enzymeInhibitionDefinition.parameters.relativeSubstrateConcentration, step: 0.1 };
const inhibitorLevels = enzymeInhibitionDefinition.parameters.inhibitorLevel.allowedValues;
const defaultInhibitorLevel = enzymeInhibitionDefinition.parameters.inhibitorLevel.defaultValue;
const inhibitionScale = 1.5;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const finiteOr = (value: number | null | undefined, fallback: number): number => Number.isFinite(value) ? value as number : fallback;
const inhibitorLevelToIndex = (level: string): number => Math.max(0, inhibitorLevels.indexOf(level as InhibitorLevel));
const normalizeInhibitorLevel = (level: string | null | undefined): InhibitorLevel => inhibitorLevels.includes(level as InhibitorLevel) ? level as InhibitorLevel : defaultInhibitorLevel;
const normalizeEnzymeInhibitionValues = (values: EnzymeInhibitionValues) => ({
  relativeSubstrateConcentration: clamp(finiteOr(values.relativeSubstrateConcentration, substrateControl.defaultValue), substrateControl.min, substrateControl.max),
  inhibitorLevel: normalizeInhibitorLevel(values.inhibitorLevel),
});
const alphaForInhibitor = (level: InhibitorLevel): number => 1 + inhibitorLevelToIndex(level) / inhibitionScale;
const calculateEnzymeRate = (substrate: number, inhibitorLevel: InhibitorLevel, curve: InhibitionCurve): number => {
  const safeSubstrate = Math.max(0, finiteOr(substrate, 0));
  const alpha = alphaForInhibitor(inhibitorLevel);
  switch (curve) {
    case "uninhibited": return safeSubstrate / (2 + safeSubstrate);
    case "competitive": return safeSubstrate / (alpha * 2 + safeSubstrate);
    case "noncompetitive": return 1 / alpha * safeSubstrate / (2 + safeSubstrate);
  }
};

function deriveEnzymeInhibitionState(values: EnzymeInhibitionValues) {
  const safeValues = normalizeEnzymeInhibitionValues(values);
  const substrate = safeValues.relativeSubstrateConcentration;
  const level = safeValues.inhibitorLevel;
  const alpha = alphaForInhibitor(level);
  return {
    safeValues,
    alpha,
    uninhibitedRate: calculateEnzymeRate(substrate, level, "uninhibited"),
    competitiveRate: calculateEnzymeRate(substrate, level, "competitive"),
    noncompetitiveRate: calculateEnzymeRate(substrate, level, "noncompetitive"),
    competitiveVmax: 1,
    noncompetitiveVmax: 1 / alpha,
    competitiveApparentKm: alpha * 2,
    noncompetitiveApparentKm: 2,
  };
}

function initializeEnzymeInhibitionSchema(): void {}
function initializeEnzymeInhibitionModel(): void {}

export {
  calculateEnzymeRate as a,
  normalizeEnzymeInhibitionValues as c,
  deriveEnzymeInhibitionState as i,
  initializeEnzymeInhibitionSchema as l,
  inhibitorLevels as n,
  inhibitorLevelToIndex as o,
  substrateControl as r,
  initializeEnzymeInhibitionModel as s,
  defaultInhibitorLevel as t,
  enzymeInhibitionDefinition as u,
};
