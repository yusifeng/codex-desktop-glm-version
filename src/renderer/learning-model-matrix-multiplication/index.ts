// Matrix-multiplication row-by-column model. Release chunk: model-f6e5e84f2aaf.js.
import "@rchunk/rolldown-runtime";

interface MatrixMultiplicationInput { selectedRow?: number; selectedColumn?: number }

const selectedRowControl = { min: 1, max: 2, step: 1, defaultValue: 1 };
const selectedColumnControl = { min: 1, max: 2, step: 1, defaultValue: 1 };
const leftMatrix = [[2, 1, 3], [4, 0, 2]] as const;
const rightMatrix = [[5, 2], [1, 4], [3, 7]] as const;
const normalizeSelection = (value: number | undefined, fallback: number, minimum: number, maximum: number): number => Math.min(Math.max(typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback, minimum), maximum);
const normalizeMatrixSelection = (input: MatrixMultiplicationInput) => ({
  selectedRow: normalizeSelection(input.selectedRow, selectedRowControl.defaultValue, selectedRowControl.min, selectedRowControl.max),
  selectedColumn: normalizeSelection(input.selectedColumn, selectedColumnControl.defaultValue, selectedColumnControl.min, selectedColumnControl.max),
});
const multiplyMatrices = (): number[][] => leftMatrix.map((row) => rightMatrix[0].map((_unused, columnIndex) => row.reduce((sum, value, index) => sum + value * rightMatrix[index][columnIndex], 0)));
const calculateMatrixMultiplication = (input: MatrixMultiplicationInput) => {
  const normalized = normalizeMatrixSelection(input);
  const rowIndex = normalized.selectedRow - 1;
  const columnIndex = normalized.selectedColumn - 1;
  const selectedRowValues = leftMatrix[rowIndex];
  const selectedColumnValues = rightMatrix.map((row) => row[columnIndex]);
  const terms = selectedRowValues.map((left, index) => ({ left, right: selectedColumnValues[index], product: left * selectedColumnValues[index] }));
  return { ...normalized, rowIndex, columnIndex, selectedRowValues, selectedColumnValues, terms, result: terms.reduce((sum, term) => sum + term.product, 0), productMatrix: multiplyMatrices() };
};
function initializeMatrixMultiplicationModel(): void {}

export { calculateMatrixMultiplication as a, selectedRowControl as i, rightMatrix as n, initializeMatrixMultiplicationModel as o, selectedColumnControl as r, normalizeMatrixSelection as s, leftMatrix as t };
