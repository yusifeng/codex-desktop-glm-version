// Survivorship-curve model: compare type I, II, and III cohort decline.
import "@rchunk/rolldown-runtime";

type SurvivorshipType = 1 | 2 | 3;
interface SurvivorshipInput { relativeAge?: number; highlightedType?: number }

const defaultSurvivorshipValues = { relativeAge: 50, highlightedType: 2 as SurvivorshipType };
const clamp = (value: number, minimum: number, maximum: number): number => Math.max(minimum, Math.min(maximum, value));
const normalizeSurvivorshipValues = (input: SurvivorshipInput) => ({
  relativeAge: Number.isFinite(input.relativeAge) ? clamp(input.relativeAge as number, 0, 100) : defaultSurvivorshipValues.relativeAge,
  highlightedType: input.highlightedType === 1 || input.highlightedType === 2 || input.highlightedType === 3
    ? input.highlightedType
    : defaultSurvivorshipValues.highlightedType,
});
const survivorshipLogExponent = (type: SurvivorshipType, relativeAge: number): number => {
  const ageRatio = clamp(relativeAge, 0, 100) / 100;
  return type === 1 ? 3 - 3 * ageRatio ** 4 : type === 2 ? 3 - 3 * ageRatio : 3 - 3 * ageRatio ** 0.25;
};
const survivorCount = (type: SurvivorshipType, relativeAge: number): number => 10 ** survivorshipLogExponent(type, relativeAge);
const calculateSurvivorship = (input: SurvivorshipInput) => {
  const normalized = normalizeSurvivorshipValues(input);
  return { ...normalized, typeI: survivorCount(1, normalized.relativeAge), typeII: survivorCount(2, normalized.relativeAge), typeIII: survivorCount(3, normalized.relativeAge) };
};
const sampleSurvivorshipCurve = (type: SurvivorshipType) => Array.from({ length: 101 }, (_unused, relativeAge) => ({ x: relativeAge, y: survivorshipLogExponent(type, relativeAge) }));
function initializeSurvivorshipCurvesModel(): void {}

export { survivorshipLogExponent as a, initializeSurvivorshipCurvesModel as i, calculateSurvivorship as n, sampleSurvivorshipCurve as r, defaultSurvivorshipValues as t };
