import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationActiveGeometry } = require("../app/.vite/build/browser-page-preload/annotation-active-geometry-projection.js");

const cache = new Map();
const deps = {
  resolveCommentElement: () => ({ id: "comment-live" }),
  resolveDesignElement: () => ({ id: "design-live" }),
  resolveAdditionalAnchor: (anchor) => ({ anchor, liveElement: null }),
  isOriginalPage: (pageUrl) => pageUrl === "original",
};

const comment = {
  kind: "comment",
  annotation: { id: "comment", anchor: { kind: "element", pageUrl: "current" }, additionalAnchors: [] },
};
const commentGeometry = projectAnnotationActiveGeometry(comment, cache, deps);
assert.deepEqual(commentGeometry.activeElement, { id: "comment-live" });
assert.deepEqual(commentGeometry.additionalAnchors, []);
assert.equal(commentGeometry.skipScreenshotCapture, false);

const design = { kind: "design", annotation: { id: "design", anchor: { kind: "element", pageUrl: "current" } } };
assert.deepEqual(projectAnnotationActiveGeometry(design, cache, deps).activeElement, { id: "design-live" });

const text = { kind: "comment", annotation: { anchor: { kind: "text", pageUrl: "current" }, additionalAnchors: [] } };
assert.equal(projectAnnotationActiveGeometry(text, cache, deps).activeElement, null);

const missing = {
  kind: "comment",
  annotation: {
    id: "missing",
    anchor: { kind: "element", pageUrl: "current" },
    additionalAnchors: [{ kind: "element" }, { kind: "element" }],
  },
};
const missingGeometry = projectAnnotationActiveGeometry(missing, cache, {
  ...deps,
  resolveCommentElement: () => null,
});
assert.equal(missingGeometry.skipScreenshotCapture, true);

const liveAdditional = projectAnnotationActiveGeometry(missing, cache, {
  ...deps,
  resolveCommentElement: () => null,
  resolveAdditionalAnchor: (anchor) => ({ anchor, liveElement: { id: "live" } }),
});
assert.equal(liveAdditional.skipScreenshotCapture, false);
assert.equal(projectAnnotationActiveGeometry({ kind: "comment", annotation: { anchor: { kind: "element", pageUrl: "original" }, additionalAnchors: [] } }, cache, { ...deps, resolveCommentElement: () => null }).skipScreenshotCapture, false);

console.log("8 preload annotation active-geometry projection assertions passed");
