// Diprotic acid-base speciation across the pH scale.
import "@rchunk/rolldown-runtime";

type SpeciesFraction = "h2a" | "ha" | "a";
interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface AcidBaseValues { pKa1?: number | null; pKa2?: number | null; pH?: number | null }

const acidBaseSpeciationType = "ACID_BASE_SPECIATION";
const acidBaseSpeciationThumbnail = "acid-base-speciation-v1";
const acidBaseSpeciationParameters: { pKa1: NumberParameter; pKa2: NumberParameter } = {
  pKa1: { kind: "number", defaultValue: 6.35, min: 0, max: 6.5 },
  pKa2: { kind: "number", defaultValue: 10.33, min: 7.5, max: 14 },
};
const acidBaseSpeciationSpecification = { type: acidBaseSpeciationType, version: 1, thumbnailAssetKey: acidBaseSpeciationThumbnail, parameters: acidBaseSpeciationParameters };
const pKa1Control = { ...acidBaseSpeciationSpecification.parameters.pKa1, step: 0.01 };
const pKa2Control = { ...acidBaseSpeciationSpecification.parameters.pKa2, step: 0.01 };
const pHControl = { defaultValue: 7, min: 0, max: 14, step: 0.01 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const finiteOrDefault = (value: number | null | undefined, defaultValue: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : defaultValue;
const normalizeAcidBaseValues = (values: AcidBaseValues) => ({
  pKa1: clamp(finiteOrDefault(values.pKa1, pKa1Control.defaultValue), pKa1Control.min, pKa1Control.max),
  pKa2: clamp(finiteOrDefault(values.pKa2, pKa2Control.defaultValue), pKa2Control.min, pKa2Control.max),
  pH: clamp(finiteOrDefault(values.pH, pHControl.defaultValue), pHControl.min, pHControl.max),
});
const calculateSpeciesFractions = (pH: number, pKa1: number, pKa2: number) => {
  const firstRatio = 10 ** (pH - pKa1);
  const secondRatio = 10 ** (2 * pH - pKa1 - pKa2);
  const denominator = 1 + firstRatio + secondRatio;
  return { h2a: 1 / denominator, ha: firstRatio / denominator, a: secondRatio / denominator };
};
const calculateAcidBaseSpeciation = (values: AcidBaseValues) => {
  const normalized = normalizeAcidBaseValues(values);
  const fractions = calculateSpeciesFractions(normalized.pH, normalized.pKa1, normalized.pKa2);
  const predominant = fractions.h2a >= fractions.ha && fractions.h2a >= fractions.a ? "H2A" : fractions.ha >= fractions.a ? "HA-" : "A2-";
  return { ...normalized, fractions, predominant };
};
const generateSpeciationCurve = (pKa1: number, pKa2: number, species: SpeciesFraction) =>
  Array.from({ length: 281 }, (_unused, index) => { const x = index / 20; return { x, y: calculateSpeciesFractions(x, pKa1, pKa2)[species] }; });

function initializeAcidBaseSpeciationSpecification(): void {}
function initializeAcidBaseSpeciationModel(): void {}

export { generateSpeciationCurve as a, acidBaseSpeciationSpecification as c, calculateAcidBaseSpeciation as i, pKa1Control as n, initializeAcidBaseSpeciationModel as o, pKa2Control as r, initializeAcidBaseSpeciationSpecification as s, pHControl as t };
