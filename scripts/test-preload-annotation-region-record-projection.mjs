import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationRegionRecords } = require("../app/.vite/build/browser-page-preload/annotation-region-record-projection.js");

const region = { kind: "region", framePath: ["frame"], rect: { x: 10, y: 20, width: 30, height: 40 } };
const element = { kind: "element", framePath: [], selector: ".target" };
const annotation = { id: "comment-1", anchor: region, additionalAnchors: [element, { ...region, rect: { x: 50, y: 60, width: 5, height: 6 } }] };
let calls = 0;
const deps = { shouldSuppress: () => { calls += 1; return false; } };
const projected = projectAnnotationRegionRecords({ enabled: true, annotations: [annotation], editor: { mode: "comment" }, activeAnnotation: annotation }, deps);
assert.equal(projected.length, 2);
assert.equal(calls, 1);
assert.equal(projected[0].anchor, region);
assert.equal(projected[0].key, "comment-1:region:frame:10:20:0");
assert.equal(projected[1].key, "comment-1:region:frame:50:60:2");

const suppressed = projectAnnotationRegionRecords({ enabled: true, annotations: [annotation], editor: null, activeAnnotation: null }, { shouldSuppress: () => true });
assert.deepEqual(suppressed, []);
const disabled = projectAnnotationRegionRecords({ enabled: false, annotations: [annotation], editor: null, activeAnnotation: null }, { shouldSuppress: () => { throw new Error("should not inspect disabled overlays"); } });
assert.deepEqual(disabled, []);
console.log("7 preload annotation region-record projection assertions passed");
