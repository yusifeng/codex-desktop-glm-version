// Multiplication represented as equal groups and repeated addition.
import "@rchunk/rolldown-runtime";

interface IntegerParameter { kind: "integer"; defaultValue: number; min: number; max: number }
interface RepeatedAdditionValues { groupCount?: number | null; itemsPerGroup?: number | null }

const repeatedAdditionType = "MULTIPLICATION_AS_REPEATED_ADDITION";
const repeatedAdditionThumbnail = "multiplication-as-repeated-addition-v1";
const repeatedAdditionParameters: { groupCount: IntegerParameter; itemsPerGroup: IntegerParameter } = {
  groupCount: { kind: "integer", defaultValue: 4, min: 1, max: 6 },
  itemsPerGroup: { kind: "integer", defaultValue: 3, min: 1, max: 6 },
};
const repeatedAdditionSpecification = { type: repeatedAdditionType, version: 1, thumbnailAssetKey: repeatedAdditionThumbnail, parameters: repeatedAdditionParameters };
const groupCountControl = { min: repeatedAdditionSpecification.parameters.groupCount.min, max: repeatedAdditionSpecification.parameters.groupCount.max, step: 1, defaultValue: repeatedAdditionSpecification.parameters.groupCount.defaultValue };
const itemsPerGroupControl = { min: repeatedAdditionSpecification.parameters.itemsPerGroup.min, max: repeatedAdditionSpecification.parameters.itemsPerGroup.max, step: 1, defaultValue: repeatedAdditionSpecification.parameters.itemsPerGroup.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeInteger = (value: number | null | undefined, defaultValue: number, minimum: number, maximum: number): number =>
  Number.isFinite(value) ? clamp(Math.round(value ?? defaultValue), minimum, maximum) : defaultValue;
const normalizeRepeatedAdditionValues = (values: RepeatedAdditionValues) => ({
  groupCount: normalizeInteger(values.groupCount, groupCountControl.defaultValue, groupCountControl.min, groupCountControl.max),
  itemsPerGroup: normalizeInteger(values.itemsPerGroup, itemsPerGroupControl.defaultValue, itemsPerGroupControl.min, itemsPerGroupControl.max),
});
const calculateRepeatedAddition = (values: RepeatedAdditionValues) => {
  const safeValues = normalizeRepeatedAdditionValues(values);
  const addends = Array.from({ length: safeValues.groupCount }, () => safeValues.itemsPerGroup);
  const total = safeValues.groupCount * safeValues.itemsPerGroup;
  return { safeValues, total, relationshipLatex: `${addends.join(" + ")} = ${safeValues.groupCount} \\times ${safeValues.itemsPerGroup} = ${total}` };
};

function initializeRepeatedAdditionSpecification(): void {}
function initializeRepeatedAdditionModel(): void {}

export { normalizeRepeatedAdditionValues as a, initializeRepeatedAdditionModel as i, itemsPerGroupControl as n, initializeRepeatedAdditionSpecification as o, calculateRepeatedAddition as r, repeatedAdditionSpecification as s, groupCountControl as t };
