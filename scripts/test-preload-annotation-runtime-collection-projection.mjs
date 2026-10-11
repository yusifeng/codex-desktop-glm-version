import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationRuntimeCollections } = require("../app/.vite/build/browser-page-preload/annotation-runtime-collection-projection.js");

const empty = [];
const comments = [
  { id: "one", pageUrl: "https://page.test", designChange: { id: "design-one" } },
  { id: "two", pageUrl: "https://other.test", designChange: { id: "design-two" } },
  { id: "three", pageUrl: "https://page.test" },
];
const deps = {
  isCurrentPage: (comment) => comment.pageUrl === "https://page.test",
  hasComments: (values) => values.length > 0,
  emptyCollection: empty,
};

const projected = projectAnnotationRuntimeCollections(
  comments,
  { activeDesignChange: { id: "design-two", source: "live" }, canUseTweaks: true, isOriginalViewEnabled: false, annotationEditorMode: "design" },
  deps,
);
assert.deepEqual([...projected.commentIndex.entries()], [["one", 1], ["two", 2], ["three", 3]]);
assert.deepEqual(projected.pageComments.map((comment) => comment.id), ["one", "three"]);
assert.deepEqual(projected.designChanges.map((change) => change.id), ["design-one", "design-two"]);
assert.deepEqual(projected.mergedDesignChanges.map((change) => change.id), ["design-one", "design-two"]);
assert.equal(projected.mergedDesignChanges[1].source, "live");
assert.equal(projected.visibleDesignChanges, projected.mergedDesignChanges);
assert.equal(projected.hasComments, true);
assert.equal(projected.isDesignMode, true);

const original = projectAnnotationRuntimeCollections(comments, {
  canUseTweaks: true,
  isOriginalViewEnabled: true,
  annotationEditorMode: "design",
}, deps);
assert.equal(original.visibleDesignChanges, empty);

const disabled = projectAnnotationRuntimeCollections(comments, {
  canUseTweaks: false,
  isOriginalViewEnabled: false,
  annotationEditorMode: "design",
}, deps);
assert.equal(disabled.mergedDesignChanges, empty);
assert.equal(disabled.isDesignMode, false);
console.log("11 preload annotation runtime-collection projection assertions passed");
