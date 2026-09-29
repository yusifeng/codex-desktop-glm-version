// Zero-based array-indexing learning model.
import "@rchunk/rolldown-runtime";

interface ArrayIndexValues { initial_length?: number | null; selected_index?: number | null }

const zeroBasedArrayIndexingType = "ZERO_BASED_ARRAY_INDEXING";
const zeroBasedArrayIndexingThumbnail = "zero-based-array-indexing-v1";
const zeroBasedArrayIndexingParameters = { initial_length: { kind: "integer", defaultValue: 6, min: 1, max: 8 } };
const zeroBasedArrayIndexingDefinition = { type: zeroBasedArrayIndexingType, version: 2, thumbnailAssetKey: zeroBasedArrayIndexingThumbnail, parameters: zeroBasedArrayIndexingParameters };
const initialLengthParameter = zeroBasedArrayIndexingDefinition.parameters.initial_length;
const arrayValues = [42, 7, 19, 3, 58, 12, 31, 6];
const clampInteger = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
  Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, Math.round(value as number))) : fallback;

function normalizeArrayIndexValues(values: ArrayIndexValues) {
  const initial_length = clampInteger(values.initial_length, initialLengthParameter.defaultValue, initialLengthParameter.min, initialLengthParameter.max);
  return { initial_length, selected_index: clampInteger(values.selected_index, 2, -1, initial_length) };
}

function deriveArrayIndexState(values: ArrayIndexValues) {
  const safeValues = normalizeArrayIndexValues(values);
  const isValid = safeValues.selected_index >= 0 && safeValues.selected_index < safeValues.initial_length;
  return {
    safeValues,
    isValid,
    lastValidIndex: safeValues.initial_length - 1,
    selectedColumn: safeValues.selected_index < 0 ? 0 : safeValues.selected_index >= safeValues.initial_length ? safeValues.initial_length + 1 : safeValues.selected_index + 1,
    selectedValue: isValid ? arrayValues[safeValues.selected_index] : null,
    values: arrayValues.slice(0, safeValues.initial_length),
  };
}

const defaultArrayIndexValues = { initial_length: initialLengthParameter.defaultValue, selected_index: 2 };
function initializeZeroBasedArrayIndexingSchema(): void {}
function initializeZeroBasedArrayIndexingModel(): void {}

export {
  initializeZeroBasedArrayIndexingSchema as a,
  initializeZeroBasedArrayIndexingModel as i,
  defaultArrayIndexValues as n,
  zeroBasedArrayIndexingDefinition as o,
  deriveArrayIndexState as r,
  initialLengthParameter as t,
};
