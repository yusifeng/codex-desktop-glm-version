import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationOverlayStyle } = require("../app/.vite/build/browser-page-preload/annotation-overlay-style-projection.js");

const base = { position: "fixed", pointerEvents: "none" };
const normal = projectAnnotationOverlayStyle({ baseStyle: base, zoomFactor: 1, viewportScale: 1, markerSize: 26, metadataHeight: 25, scaleVariable: "--scale" });
assert.equal(normal.position, "fixed");
assert.equal(normal["--scale"], "1");
assert.equal(normal["--browser-sidebar-draft-marker-size"], "26px");
assert.equal(normal.transform, undefined);

const zoomed = projectAnnotationOverlayStyle({ baseStyle: base, zoomFactor: 1.25, viewportScale: 1.5, markerSize: 26, metadataHeight: 25, scaleVariable: "--scale" });
assert.equal(zoomed.height, "125vh");
assert.equal(zoomed.width, "125vw");
assert.equal(zoomed.transform, "scale(0.8)");
assert.equal(zoomed["--scale"], "1.5");
assert.equal(zoomed["--browser-sidebar-metadata-height"], "37.5px");
assert.equal(zoomed["--browser-sidebar-marker-label-offset"], "-0.75px");
console.log("9 preload annotation overlay-style projection assertions passed");
