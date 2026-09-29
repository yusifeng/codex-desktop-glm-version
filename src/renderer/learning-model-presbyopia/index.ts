// Accommodation and retinal blur in typical vision versus presbyopia.
import "@rchunk/rolldown-runtime";

type VisionCondition = "typical" | "presbyopia";
interface PresbyopiaValues { condition?: unknown; objectDistanceCentimeters?: number | null }

const presbyopiaType = "PRESBYOPIA";
const presbyopiaThumbnail = "presbyopia-v3";
const presbyopiaParameters = {
  condition: { kind: "enum" as const, defaultValue: "presbyopia" as VisionCondition, allowedValues: ["typical", "presbyopia"] as VisionCondition[] },
  objectDistanceCentimeters: { kind: "number" as const, defaultValue: 35, min: 25, max: 200 },
};
const presbyopiaSpecification = { type: presbyopiaType, version: 2, thumbnailAssetKey: presbyopiaThumbnail, parameters: presbyopiaParameters };
const conditions = presbyopiaSpecification.parameters.condition.allowedValues;
const conditionControl = { min: 0, max: conditions.length - 1, step: 1 };
const objectDistanceControl = { min: presbyopiaSpecification.parameters.objectDistanceCentimeters.min, max: presbyopiaSpecification.parameters.objectDistanceCentimeters.max, step: 5 };
const defaultPresbyopiaValues = { condition: presbyopiaSpecification.parameters.condition.defaultValue, objectDistanceCentimeters: presbyopiaSpecification.parameters.objectDistanceCentimeters.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const presbyopiaAccommodationLimit = 1.25;
const focusOffsetScale = 12;
const isVisionCondition = (value: unknown): value is VisionCondition => conditions.some((condition) => condition === value);
const normalizePresbyopiaValues = (values: PresbyopiaValues) => ({
  condition: isVisionCondition(values.condition) ? values.condition : defaultPresbyopiaValues.condition,
  objectDistanceCentimeters: Number.isFinite(values.objectDistanceCentimeters) ? clamp(values.objectDistanceCentimeters ?? defaultPresbyopiaValues.objectDistanceCentimeters, objectDistanceControl.min, objectDistanceControl.max) : defaultPresbyopiaValues.objectDistanceCentimeters,
});
const distanceCategory = (distance: number): string => distance <= 55 ? "near" : distance >= 135 ? "far" : "middle";
const calculatePresbyopia = (values: PresbyopiaValues) => {
  const safeValues = normalizePresbyopiaValues(values);
  const accommodationDemandDiopters = 100 / safeValues.objectDistanceCentimeters;
  const minimumDemand = 100 / objectDistanceControl.max;
  const maximumDemand = 100 / objectDistanceControl.min;
  const availableAccommodationDiopters = safeValues.condition === "typical" ? accommodationDemandDiopters : Math.min(accommodationDemandDiopters, presbyopiaAccommodationLimit);
  const accommodationFraction = clamp((availableAccommodationDiopters - minimumDemand) / (maximumDemand - minimumDemand), 0, 1);
  const focusOffset = (accommodationDemandDiopters - availableAccommodationDiopters) * focusOffsetScale;
  return { safeValues, condition: safeValues.condition, accommodationDemandDiopters, availableAccommodationDiopters, lensBulge: 7 + accommodationFraction * 15, focusOffset, retinalSpread: 1.5 + focusOffset * 0.16, blurAmount: clamp(focusOffset / 8, 0, 2.4), isClear: focusOffset < 2.5, distanceCategory: distanceCategory(safeValues.objectDistanceCentimeters) };
};

function initializePresbyopiaSpecification(): void {}
function initializePresbyopiaModel(): void {}

export { calculatePresbyopia as a, initializePresbyopiaSpecification as c, conditions as i, presbyopiaSpecification as l, defaultPresbyopiaValues as n, initializePresbyopiaModel as o, objectDistanceControl as r, normalizePresbyopiaValues as s, conditionControl as t };
