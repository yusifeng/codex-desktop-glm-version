// Two-dimensional array indexing teaching model.
import "@rchunk/rolldown-runtime";

interface IntegerParameter { kind: "integer"; defaultValue: number; min: number; max: number }
interface ArrayIndexValues { rows?: number | null; columns?: number | null; rowIndex?: number | null; columnIndex?: number | null }

const twoDimensionalArrayIndexingType = "TWO_DIMENSIONAL_ARRAY_INDEXING";
const twoDimensionalArrayIndexingThumbnail = "two-dimensional-array-indexing-v1";
const twoDimensionalArrayIndexingParameters: { rows: IntegerParameter; columns: IntegerParameter } = {
  rows: { kind: "integer", defaultValue: 3, min: 2, max: 5 },
  columns: { kind: "integer", defaultValue: 5, min: 2, max: 6 },
};
const twoDimensionalArrayIndexingSpecification = {
  type: twoDimensionalArrayIndexingType,
  version: 2,
  thumbnailAssetKey: twoDimensionalArrayIndexingThumbnail,
  parameters: twoDimensionalArrayIndexingParameters,
};
const { rows: rowsParameter, columns: columnsParameter } = twoDimensionalArrayIndexingSpecification.parameters;

const normalizeInteger = (value: number | null | undefined, minimum: number, maximum: number, fallback: number): number =>
  Math.min(maximum, Math.max(minimum, typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback));
const defaultArrayIndexValues = () => ({
  rows: rowsParameter.defaultValue,
  columns: columnsParameter.defaultValue,
  rowIndex: 1,
  columnIndex: 2,
});

function normalizeArrayIndexValues(values: ArrayIndexValues) {
  const rows = normalizeInteger(values.rows, rowsParameter.min, rowsParameter.max, rowsParameter.defaultValue);
  const columns = normalizeInteger(values.columns, columnsParameter.min, columnsParameter.max, columnsParameter.defaultValue);
  return {
    rows,
    columns,
    rowIndex: normalizeInteger(values.rowIndex, 0, rows - 1, 0),
    columnIndex: normalizeInteger(values.columnIndex, 0, columns - 1, 0),
  };
}

const getArrayCellValue = (rowIndex: number, columnIndex: number): number => (rowIndex + 1) * 10 + columnIndex + 1;
const calculateArraySelection = (values: ArrayIndexValues) => {
  const normalized = normalizeArrayIndexValues(values);
  return { ...normalized, selectedValue: getArrayCellValue(normalized.rowIndex, normalized.columnIndex) };
};

function initializeTwoDimensionalArrayIndexingSpecification(): void {}
function initializeTwoDimensionalArrayIndexingModel(): void {}

export {
  getArrayCellValue as a,
  normalizeArrayIndexValues as i,
  calculateArraySelection as n,
  initializeTwoDimensionalArrayIndexingSpecification as o,
  initializeTwoDimensionalArrayIndexingModel as r,
  twoDimensionalArrayIndexingSpecification as s,
  defaultArrayIndexValues as t,
};
