import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REAL_DEPENDENCIES = new Set(["drawing-frame-geometry", "spreadsheet-utils"]);
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "geometry-cluster-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => {
        const dependency = importPath.slice(8);
        return REAL_DEPENDENCIES.has(dependency) ? { path: path.join(ROOT, "src/renderer", dependency, "index.ts") } : { path: dependency, namespace: "mock" };
      });
      build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "export {};", loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

// drawing-frame-geometry
const geometry = await bundle("drawing-frame-geometry");
assert.deepEqual(Object.keys(geometry), ["C", "S", "_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "x", "y"]);
assert.equal(geometry.v(12, 0, 10), 10);
assert.deepEqual(geometry.x({ x: 10, y: 20, k: 2 }, 14, 28), { x: 2, y: 4 });
assert.deepEqual(geometry.S({ x: 10, y: 20, k: 2 }, 2, 4), { x: 14, y: 28 });
assert.deepEqual(geometry.C({ x: 0, y: 0, k: 1 }, 50, 25, 2, 0.5, 3), { x: -50, y: -25, k: 2 });
assert.deepEqual(geometry._({ x: -900, y: 30, k: 2 }, { width: 300, height: 200 }, { width: 200, height: 100 }), { x: -400, y: 0, k: 2 });
assert.deepEqual(geometry.g({ x: -12, y: -8, k: 2 }), { left: 12, top: 8 });
assert.deepEqual(geometry.h({ x: -12, y: -8, k: 2 }), { left: 6, top: 4 });
assert.equal(geometry.y(new Map([[1, { x: 0, y: 0 }]])), null);
assert.deepEqual(geometry.y(new Map([[1, { x: 0, y: 0 }], [2, { x: 6, y: 8 }]])), { centerX: 3, centerY: 4, distance: 10 });
assert.deepEqual(geometry.d(2), { visibleSize: 3, halfVisibleSize: 1.5, hitRadius: 6, rotationBand: 9, rotationHandleDistance: 14 });
assert.equal(geometry.f("nw"), "nwse-resize");
assert.equal(geometry.f("ne"), "nesw-resize");
assert.equal(geometry.f(null), null);
assert.match(geometry.p(), /grab$/);
assert.equal(geometry.s(270), -90);
assert.equal(geometry.s(-270), 90);
const frame = { left: 10, top: 20, width: 40, height: 20, rotation: 0 };
assert.deepEqual(geometry.n(frame), { x: 30, y: 30 });
assert.deepEqual(geometry.r(frame), { nw: { x: 10, y: 20 }, ne: { x: 50, y: 20 }, sw: { x: 10, y: 40 }, se: { x: 50, y: 40 } });
assert.deepEqual(geometry.i([frame, { left: 50, top: 40, width: 10, height: 20 }]), { left: 10, top: 20, width: 50, height: 40 });
assert.equal(geometry.c(frame, { x: 30, y: 30 }), true);
assert.equal(geometry.c(frame, { x: 60, y: 30 }), false);
assert.equal(geometry.l(frame, { x: 10, y: 20 }, 1), "nw");
assert.equal(geometry.t({ left: 0, top: 0, width: 100, height: 100 }, frame), true);
assert.equal(geometry.u(frame, { x: 30, y: 5 }, 1), true);

// floating-ui-modifiers
const modifiers = await bundle("floating-ui-modifiers");
assert.deepEqual(Object.keys(modifiers), ["i", "n", "r", "t"]);
assert.deepEqual(modifiers.r({ transform: { x: 3, y: 4, scaleX: 1 } }), { x: 3, y: 0, scaleX: 1 });
assert.deepEqual(modifiers.i({ transform: { x: 3, y: 4 } }), { x: 0, y: 4 });
const drag = { draggingNodeRect: { top: 10, bottom: 30, left: 10, right: 30 }, scrollableAncestorRects: [{ top: 0, left: 0, width: 100, height: 100 }], transform: { x: -20, y: 80 } };
assert.deepEqual(modifiers.n(drag), { x: -10, y: 70 });
assert.deepEqual(modifiers.n({ transform: { x: 1, y: 2 } }), { x: 1, y: 2 });
assert.equal(modifiers.t(), undefined);

// presentation-review-utils
const review = await bundle("presentation-review-utils");
const snapshot = { slideIds: ["slide-1"], slideLabels: ["Intro"], selectedSlideIdx: 0, selectedElementIds: ["a", "b"], primarySelectedElementId: "b", selectedSlideElementTargets: [{ id: "a", frame: { left: 10, top: 20, width: 20, height: 10 } }, { id: "b", frame: { left: 50, top: 10, width: 10, height: 30 } }], inspector: { slideElements: [{ id: "a", kind: "text", name: "Title" }, { id: "b", kind: "text", name: "Body" }] } };
assert.deepEqual(review.l(snapshot), { left: 10, top: 10, width: 50, height: 30 });
const selection = review.r({ snapshot, anchorPoint: { x: 55, y: 25 } });
assert.equal(selection.type, "presentation-element-selection");
assert.equal(selection.primaryElementId, "b");
assert.equal(selection.primaryElementOrdinal, 2);
assert.deepEqual(selection.primaryElementOffset, { x: 45, y: 15 });
assert.equal(review.c(selection), "Intro · 2 elements");
assert.equal(review.c({ ...selection, elementIds: ["a"], primaryElementId: null }), "Intro · a");
const region = review.i({ snapshot, frame: { left: 1, top: 2, width: 3, height: 4 }, anchorPoint: { x: 2, y: 3 }, containedElements: [{ elementId: "a", frame: { left: 0, top: 0, width: 1, height: 1 } }] });
assert.equal(region.slideLabel, "Intro");
assert.equal(region.containedElements[0].elementId, "a");
assert.equal(review.c(region), "Intro · Region");
assert.equal(review.c({ ...region, frame: { left: 1, top: 2, width: 0, height: 0 } }), "Intro · Point");
assert.deepEqual(review.s(region, { left: 100, top: 200, scale: 2 }), { left: 102, top: 204, width: 6, height: 8 });
assert.deepEqual(review.o(region, { left: 100, top: 200, scale: 2 }), { left: 104, top: 206, width: 0, height: 0 });
const drawing = review.n({ snapshot, frame: { left: 1, top: 2, width: 3, height: 4 }, viewportBounds: { left: 10, top: 20, width: 100, height: 80 } });
assert.equal(drawing.type, "presentation-drawing-region");
assert.equal(review.a(drawing), "Intro · Drawing");
assert.equal(review.i({ ...region, snapshot: { ...snapshot, slideIds: [] } }), null);
assert.equal(review.r({ snapshot: { ...snapshot, selectedElementIds: [] } }), null);
assert.deepEqual(review.t({ kind: "slide", slideId: "s", slideIndex: 1, slideLabel: "Slide 2" }, { x: 7, y: 8 }).frame, { left: 7, top: 8, width: 0, height: 0 });
assert.equal(review.t({ kind: "shape", slideId: "s", slideIndex: 1, slideLabel: "Slide 2", elementId: "e", elementName: "Box" }, { x: 7, y: 8 }).primaryElementName, "Box");

// tableau10-palette
const palette = await bundle("tableau10-palette");
assert.deepEqual(Object.keys(palette), ["i", "n", "r", "t"]);
assert.deepEqual(palette.r("ff000000ff00"), ["#ff0000", "#00ff00"]);
assert.deepEqual(palette.r("abcdef1"), ["#abcdef"]);
assert.equal(palette.t.length, 10);
assert.equal(palette.t[0], "#4e79a7");
assert.equal(palette.t.at(-1), "#bab0ab");
assert.equal(palette.n(), undefined);

// spreadsheet-utils
const spreadsheet = await bundle("spreadsheet-utils");
assert.equal(spreadsheet.a(0), "A");
assert.equal(spreadsheet.a(25), "Z");
assert.equal(spreadsheet.a(26), "AA");
assert.equal(spreadsheet.i("AA10"), 26);
assert.equal(spreadsheet.f("AA10"), 9);
assert.equal(spreadsheet.r(), 64);
assert.equal(spreadsheet.r(8, 7), 56);
assert.equal(spreadsheet.l(56, 7), 8);
assert.equal(spreadsheet.c(15), 20);
assert.equal(spreadsheet.u(20), 15);
assert.deepEqual(spreadsheet.d(11), { padLr: 2, padTb: 4 / 3 });
assert.equal(spreadsheet.n("0xFF112233"), "rgba(17, 34, 51, 1.000)");
assert.equal(spreadsheet.n("abcdef"), "#abcdef");
assert.equal(spreadsheet.n("bad"), "#ffffff");
assert.equal(spreadsheet.o(2), "#FF0000");
assert.equal(spreadsheet.o(64), "#000000");
assert.equal(spreadsheet.t, 8.43);

// spreadsheet-address-utils
const address = await bundle("spreadsheet-address-utils");
assert.equal(address.a(" 'Sheet 1'!$b$2:$a$1 "), "B2:A1");
assert.equal(address.a("  "), null);
assert.equal(address.i(0, 0), "A1");
assert.equal(address.i(9, 26), "AA10");
assert.equal(address.n({ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }), "A1");
assert.equal(address.n({ startRow: 0, startCol: 0, endRow: 2, endCol: 1 }), "A1:B3");
assert.deepEqual(address.o("B3:A1"), { ref: "A1:B3", bounds: { startRow: 0, startCol: 0, endRow: 2, endCol: 1 } });
assert.equal(address.o(""), null);
assert.deepEqual(address.t({ startRow: 1, startCol: 2, endRow: 3, endCol: 5 }), { rows: 3, cols: 4 });
assert.equal(address.s({ startRow: 0, startCol: 0, endRow: 2, endCol: 2 }, { startRow: 2, startCol: 2, endRow: 4, endCol: 4 }), true);
assert.equal(address.s({ startRow: 0, startCol: 0, endRow: 1, endCol: 1 }, { startRow: 2, startCol: 2, endRow: 4, endCol: 4 }), false);
assert.deepEqual(address.c("='My ''Sheet'!$B$2:$A$1"), { sheetName: "My 'Sheet", ref: "A1:B2" });
assert.deepEqual(address.c("=C4"), { ref: "C4" });
assert.equal(address.r(), undefined);

// freeze-panes
const freeze = await bundle("freeze-panes");
const grid = { columnWidths: [50, 60, 70], rowHeights: [20, 30, 40], freezePanes: { columnCount: 1, rowCount: 1 } };
assert.deepEqual(freeze.t([10, 20, 30]), [0, 10, 30, 60]);
assert.equal(freeze.s([0, 10, 30], 18), 1);
assert.equal(freeze.s([0, 10, 30], -5), 0);
assert.deepEqual(freeze.r(grid), { frozenBodyWidth: 50, frozenBodyHeight: 20, freezeLineX: 90, freezeLineY: 40 });
const camera = { x: -100, y: -60, k: 2 };
assert.deepEqual(freeze.c({ ...grid, camera, screenX: 40, screenY: 20 }), { x: 20, y: 10 });
assert.deepEqual(freeze.c({ ...grid, camera, screenX: 240, screenY: 160 }), { x: 170, y: 110 });
assert.deepEqual(freeze.l({ ...grid, camera, worldX: 170, worldY: 110 }), { x: 120, y: 80 });
assert.deepEqual(freeze.u({ ...grid, camera, worldX: 170, worldY: 110 }), { x: 240, y: 160 });
assert.deepEqual(freeze.n({ ...grid, camera: { x: -999, y: -999, k: 3 }, minZoom: 1, maxZoom: 2, viewportWidth: 200, viewportHeight: 120 }), { x: -240, y: -100, k: 2 });
assert.deepEqual(freeze.n({ ...grid, camera: { x: 10, y: 10, k: 0.5 }, minZoom: 1, maxZoom: 2, viewportWidth: 1000, viewportHeight: 1000 }), { x: -0, y: -0, k: 1 });
assert.deepEqual(freeze.a({ ...grid, camera, worldX: 80, worldY: 30, width: 100, height: 50 }), [{ x: 80, y: 30, width: 10, height: 10 }, { x: 80, y: 40, width: 10, height: 10 }, { x: 90, y: 30, width: 40, height: 10 }, { x: 90, y: 40, width: 40, height: 10 }]);
assert.deepEqual(freeze.o({ ...grid, camera, worldX: 80, worldY: 30, width: 100, height: 50 })[0], { x: 160, y: 60, width: 20, height: 20 });
assert.deepEqual(freeze.a({ ...grid, camera, worldX: 0, worldY: 0, width: 0, height: 10 }), []);
assert.equal(freeze.i(), undefined);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(`${assertionCount} canvas and spreadsheet geometry cluster assertions passed`);
