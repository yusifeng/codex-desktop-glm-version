import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REAL = new Set(["spreadsheet-utils", "drawing-frame-geometry", "freeze-panes"]);
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/workbook-review-utils/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "workbook-review-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => { const module = importPath.slice(8); return REAL.has(module) ? { path: path.join(ROOT, "src/renderer", module, "index.ts") } : { path: module, namespace: "mock" }; }); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: module === "draw-presence-label" ? "export const t=()=>{};" : "export {};", loader: "js" })); } }] });
const review = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(Object.keys(review), ["C", "S", "_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "w", "x", "y"]);

assert.deepEqual(review.C({ row: 4, col: 1 }, { row: 2, col: 3 }), { r1: 2, c1: 1, r2: 4, c2: 3 });
assert.deepEqual(review.y("AA10"), { row: 9, col: 26 });
assert.equal(review._([["<&\"", null], [1, true]]), "<table><tr><td>&lt;&amp;&quot;</td><td></td></tr><tr><td>1</td><td>true</td></tr></table>");
const clipboard = review.x("1\ttrue\t=text\n 2\tfalse\tword");
assert.equal(clipboard.kind, "copy");
assert.deepEqual(clipboard.values, [[1, true, "=text"], [2, false, "word"]]);
assert.deepEqual(clipboard.formulas, [[null, null, "=text"], [null, null, null]]);
assert.deepEqual(clipboard.source.range, { r1: 0, c1: 0, r2: 1, c2: 2 });
assert.match(clipboard.html, /^<table>/);
const fromHtml = review.b("<table><tr><td>A</td><td>B</td></tr></table>");
assert.equal(fromHtml.html, "<table><tr><td>A</td><td>B</td></tr></table>");
assert.deepEqual(fromHtml.values, [["A", "B"]]);

const grid = { camera: { x: 0, y: 0, k: 2 }, freezePanes: { columnCount: 0, rowCount: 0 }, columnWidths: [50, 60], rowHeights: [20, 30] };
assert.equal(review.w({ ...grid, selectionRect: { r1: 0, c1: 0, r2: 0, c2: 0 }, screenX: 180, screenY: 80 }), true);
assert.equal(review.w({ ...grid, selectionRect: { r1: 0, c1: 0, r2: 0, c2: 0 }, screenX: 100, screenY: 20 }), false);
assert.equal(review.w({ ...grid, columnWidths: [], selectionRect: { r1: 0, c1: 0, r2: 0, c2: 0 }, screenX: 0, screenY: 0 }), false);
assert.deepEqual(review.o([]), null);
assert.deepEqual(review.o([{ left: 10, top: 20, width: 5, height: 10 }, { left: 0, top: 25, width: 20, height: 15 }]), { left: 0, top: 20, width: 20, height: 20 });

const range = review.m({ sheetName: "Sheet1", startAddress: "A1", endAddress: "B3", startRow: 0, startCol: 0, endRow: 2, endCol: 1 });
assert.equal(range.type, "workbook-range");
assert.equal(range.rangeAddress, "A1:B3");
assert.equal(range.rows, 3);
assert.equal(range.cols, 2);
const single = review.m({ sheetName: "Sheet1", startAddress: "C4", endAddress: "C4", startRow: 3, startCol: 2, endRow: 3, endCol: 2 });
assert.equal(single.rangeAddress, "C4");
assert.equal(review.n({ sheetName: "Sheet1", selectionSummary: { rangeAddress: "", rows: 0, cols: 0, rect: null } }), null);
const selected = review.n({ sheetName: "Sheet1", selectionSummary: { rangeAddress: "A1:B2", rows: 2, cols: 2, rect: { r1: 0, c1: 0, r2: 1, c2: 1 } }, anchorPoint: { x: 10, y: 20 } });
assert.deepEqual(selected.anchorPoint, { x: 10, y: 20 });
assert.equal(review.c(review.r({ sheetName: "Sheet1", logicalBounds: { left: 40, top: 20, width: 50, height: 20 }, viewportBounds: { left: 0, top: 0, width: 100, height: 40 }, rangeAddress: "A1" })), "Sheet1!A1 · Drawing");
assert.equal(review.c(review.r({ sheetName: "Sheet1", logicalBounds: { left: 40, top: 20, width: 50, height: 20 }, viewportBounds: { left: 0, top: 0, width: 100, height: 40 } })), "Sheet1 · Drawing");

const floatingElement = { id: "chart-1", kind: "xlsx-chart", logicalBounds: { x: 50, y: 30, width: 100, height: 60 }, rotation: 5 };
const floating = review.i({ sheetName: "Sheet1", selectedFloatingElement: floatingElement, anchorPoint: { x: 75, y: 45 } });
assert.equal(floating.type, "workbook-floating-element");
assert.equal(floating.elementId, "chart-1");
assert.deepEqual(floating.elementOffset, { x: 25, y: 15 });
assert.equal(review.t({ snapshot: { activeSheetName: "Sheet1" }, selectedFloatingElement: floatingElement, selectionSummary: { rangeAddress: "A1", rows: 1, cols: 1, rect: { r1: 0, c1: 0, r2: 0, c2: 0 } } }).elementId, "chart-1");
assert.equal(review.t({ snapshot: { activeSheetName: "Sheet1" }, selectedFloatingElement: null, selectionSummary: { rangeAddress: "A1", rows: 1, cols: 1, rect: { r1: 0, c1: 0, r2: 0, c2: 0 } } }).rangeAddress, "A1");
assert.deepEqual(review.a({ color: "#f00", rect: { r1: 1, c1: 2, r2: 3, c2: 4 } }), { r1: 1, c1: 2, r2: 3, c2: 4, color: "#f00", dashed: true, fillAlpha: 0.12, borderWidthPx: 2, borderRadiusPx: 0, visibleWhenCellSelectionSuppressed: true });

const covered = review.s({ logicalBounds: { left: 45, top: 25, width: 60, height: 30 }, columnWidths: [50, 50], rowHeights: [20, 20], colOffsets: [0, 50, 100], rowOffsets: [0, 20, 40] });
assert.deepEqual(covered.coveredCells, { r1: 0, c1: 0, r2: 1, c2: 1 });
assert.equal(covered.rangeAddress, "A1:B2");
assert.deepEqual(review.s({ logicalBounds: { left: 0, top: 0, width: 0, height: 0 }, columnWidths: [], rowHeights: [], colOffsets: [0], rowOffsets: [0] }), { rangeAddress: null, coveredCells: null });
const targetBounds = review.u({ ...grid, target: selected });
assert.deepEqual(targetBounds, { left: 80, top: 40, width: 220, height: 100 });
assert.deepEqual(review.l({ ...grid, target: floating }), { left: 150, top: 90, width: 0, height: 0 });

const operations = [];
const context = new Proxy({ canvas: {}, measureText: () => ({ width: 10 }) }, { get(target, property) { if (property in target) return target[property]; if (String(property).startsWith("set") || ["beginPath", "moveTo", "arcTo", "closePath", "stroke", "clearRect", "save", "restore", "scale", "rect", "clip", "fillRect", "strokeRect", "fill", "fillText", "lineTo"].includes(String(property))) return (...args) => operations.push([property, ...args]); return target[property]; }, set(target, property, value) { target[property] = value; operations.push([property, value]); return true; } });
review.h({ ctx: context, accentStroke: "blue", rect: { x: 1, y: 2, width: 10, height: 8 }, coordinateScale: 2 });
assert.equal(context.strokeStyle, "blue");
assert.equal(context.lineWidth, 1);
assert.equal(operations.filter(operation => operation[0] === "arcTo").length, 4);
assert.ok(operations.some(operation => operation[0] === "stroke"));
const canvas = { getContext: () => context };
review.d({ ...grid, overlayCanvas: canvas, viewportMetrics: { width: 400, height: 300, dpr: 2 }, syncViewportCanvases() {}, accentStroke: "red", selectionRect: { r1: 0, c1: 0, r2: 0, c2: 0 } });
assert.ok(operations.some(operation => operation[0] === "setTransform"));
assert.ok(operations.some(operation => operation[0] === "clearRect"));
assert.equal(review.S(), undefined);
assert.equal(review.f(), undefined);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(`${assertionCount} workbook review utility assertions passed`);
