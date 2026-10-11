import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { withAnnotationMarkerPointerEventsDisabled } = require("../app/.vite/build/browser-page-preload/annotation-marker-pointer-events.js");
const markers = [{ value: "auto" }, { value: "initial" }];
const deps = { getPointerEvents: (element) => element.value, setPointerEvents: (element, value) => { element.value = value; } };
assert.equal(withAnnotationMarkerPointerEventsDisabled(markers, () => markers.every((marker) => marker.value === "none"), deps), true);
assert.deepEqual(markers.map((marker) => marker.value), ["auto", "initial"]);
assert.throws(() => withAnnotationMarkerPointerEventsDisabled(markers, () => { throw new Error("boom"); }, deps), /boom/);
assert.deepEqual(markers.map((marker) => marker.value), ["auto", "initial"]);

console.log("3 preload annotation marker pointer-events assertions passed");
