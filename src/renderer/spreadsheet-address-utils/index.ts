import "@rchunk/rolldown-runtime";
import { a as columnIndexToName, f as rowReferenceToIndex, i as columnNameToIndex, s as initializeSpreadsheetUtils } from "@rchunk/spreadsheet-utils";

export interface CellBounds { endCol: number; endRow: number; startCol: number; startRow: number }
export interface ParsedCellRange { bounds: CellBounds; ref: string }
function cellReference(row: number, column: number): string { return `${columnIndexToName(column)}${row + 1}`; }
function boundsToReference(bounds: CellBounds): string { const start = cellReference(bounds.startRow, bounds.startCol), end = cellReference(bounds.endRow, bounds.endCol); return start === end ? start : `${start}:${end}`; }
function normalizeReference(reference: string): string | null { const trimmed = reference.trim(); return trimmed ? (trimmed.includes("!") ? trimmed.slice(trimmed.indexOf("!") + 1) : trimmed).replace(/\$/g, "").toUpperCase() : null; }
function parseCellRange(reference: string): ParsedCellRange | null {
  const normalized = normalizeReference(reference); if (!normalized) return null;
  const [start, rawEnd] = normalized.split(":"); if (!start) return null; const end = rawEnd ?? start;
  const bounds = { startRow: Math.min(rowReferenceToIndex(start), rowReferenceToIndex(end)), startCol: Math.min(columnNameToIndex(start), columnNameToIndex(end)), endRow: Math.max(rowReferenceToIndex(start), rowReferenceToIndex(end)), endCol: Math.max(columnNameToIndex(start), columnNameToIndex(end)) };
  return { ref: boundsToReference(bounds), bounds };
}
const rangeDimensions = (bounds: CellBounds): { cols: number; rows: number } => ({ rows: bounds.endRow - bounds.startRow + 1, cols: bounds.endCol - bounds.startCol + 1 });
const rangesOverlap = (left: CellBounds, right: CellBounds): boolean => left.startRow <= right.endRow && left.endRow >= right.startRow && left.startCol <= right.endCol && left.endCol >= right.startCol;
const unquoteSheetName = (name: string): string => name.startsWith("'") && name.endsWith("'") && name.length >= 2 ? name.slice(1, -1).replace(/''/g, "'") : name;
function parseFormulaReference(value: string): { ref: string; sheetName?: string } { const expression = value.startsWith("=") ? value.slice(1) : value, separator = expression.indexOf("!"); if (separator === -1) return { ref: parseCellRange(expression)?.ref ?? expression }; const sheet = expression.slice(0, separator), reference = expression.slice(separator + 1), parsed = parseCellRange(reference); return { sheetName: unquoteSheetName(sheet), ref: parsed?.ref ?? reference }; }
function initializeSpreadsheetAddressUtils(): void { initializeSpreadsheetUtils(); }
export { normalizeReference as a, parseFormulaReference as c, cellReference as i, boundsToReference as n, parseCellRange as o, initializeSpreadsheetAddressUtils as r, rangesOverlap as s, rangeDimensions as t };
