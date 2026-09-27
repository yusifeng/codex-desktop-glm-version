import "@rchunk/rolldown-runtime";
const DEFAULT_PIXEL_WIDTH = 7;
const EXCEL_COLUMN_WIDTH_BASE = 8.43;
const normalizeCharacterWidth = (value?: number | null): number => value && value > 0 ? value : DEFAULT_PIXEL_WIDTH;
const roundedCharacterWidth = (value?: number | null): number => Math.ceil(normalizeCharacterWidth(value));
const columnWidthToPixels = (width?: number | null, characterWidth?: number | null): number => width == null || width <= 0 ? 64 : width * roundedCharacterWidth(characterWidth);
function pixelsToColumnWidth(pixels: number, characterWidth?: number | null): number { if (!Number.isFinite(pixels) || pixels <= 0) return 0; return Math.round(pixels / roundedCharacterWidth(characterWidth) * 100) / 100; }
const pointsToPixels = (points?: number | null): number => ((points == null || points === 0 ? 15 : points) * 96) / 72;
const pixelsToPoints = (pixels?: number | null): number => Number.isFinite(pixels ?? 0) ? ((pixels ?? 0) * 72) / 96 : 15;
function cellPadding(fontSize: number): { padLr: number; padTb: number } { const size = fontSize > 0 ? fontSize : 11; return { padLr: Math.max(2, Math.floor(size * 0.1)), padTb: Math.max(4 / 3, Math.floor(size * 0)) }; }
function columnIndexToName(index: number): string { let output = ""; for (let value = index + 1; value > 0;) { const remainder = (value - 1) % 26; output = String.fromCharCode(65 + remainder) + output; value = Math.floor((value - remainder) / 26); } return output; }
function columnNameToIndex(reference: string): number { const match = reference.match(/[A-Z]+/); if (!match) return 0; let value = 0; for (const character of match[0]) value = value * 26 + character.charCodeAt(0) - 64; return value - 1; }
const rowReferenceToIndex = (reference: string): number => { const match = reference.match(/\d+/); return match ? Number.parseInt(match[0], 10) - 1 : 0; };
function excelColorToCss(value: string): string { const color = value.replace(/^0x/i, ""); return color.length === 8 ? `rgba(${Number.parseInt(color.slice(2, 4), 16)}, ${Number.parseInt(color.slice(4, 6), 16)}, ${Number.parseInt(color.slice(6, 8), 16)}, 1.000)` : color.length === 6 ? `#${color}` : "#ffffff"; }
const indexedColors = "#000000.#FFFFFF.#FF0000.#00FF00.#0000FF.#FFFF00.#FF00FF.#00FFFF.#000000.#FFFFFF.#FF0000.#00FF00.#0000FF.#FFFF00.#FF00FF.#00FFFF.#800000.#008000.#000080.#808000.#800080.#008080.#C0C0C0.#808080.#9999FF.#993366.#FFFFCC.#CCFFFF.#660066.#FF8080.#0066CC.#CCCCFF.#000080.#FF00FF.#FFFF00.#00FFFF.#800080.#800000.#008080.#0000FF.#00CCFF.#CCFFFF.#CCFFCC.#FFFF99.#99CCFF.#FF99CC.#CC99FF.#FFCC99.#3366FF.#33CCCC.#99CC00.#FFCC00.#FF9900.#FF6600.#666699.#969696.#003366.#339966.#003300.#333300.#993300.#993366.#333399.#333333".split(".");
const indexedColor = (index?: number | null): string | undefined => index == null ? undefined : index === 64 ? "#000000" : indexedColors[index];
function initializeSpreadsheetUtils(): void {}
export { columnIndexToName as a, pointsToPixels as c, cellPadding as d, rowReferenceToIndex as f, columnNameToIndex as i, pixelsToColumnWidth as l, excelColorToCss as n, indexedColor as o, columnWidthToPixels as r, initializeSpreadsheetUtils as s, EXCEL_COLUMN_WIDTH_BASE as t, pixelsToPoints as u };
