import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "annotation-current-page-targets-"));
const bundledModule = path.join(temporaryDirectory, "annotation-current-page-target-projection.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/browser-page-preload/annotation-current-page-target-projection.ts")],
  outfile: bundledModule,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const require = createRequire(import.meta.url);
const { projectAnnotationCurrentPageTargets } = require(bundledModule);

const fixedAnchor = { kind: "element", isFixed: true, selector: null };
const movingAnchor = { kind: "element", isFixed: false, selector: "#moving" };
const offPageAnchor = { kind: "element", isFixed: false, selector: "#off-page" };
const comments = [
  { id: "fixed", anchor: fixedAnchor, additionalAnchors: [], current: true },
  { id: "moving", anchor: movingAnchor, additionalAnchors: [], current: true },
  { id: "off-page", anchor: offPageAnchor, additionalAnchors: [], current: false },
];
const observedTextAnchors = new Map([
  ["fixed", { sourceAnchor: fixedAnchor, value: "observed-fixed" }],
  ["moving", { sourceAnchor: { ...movingAnchor }, value: "stale-moving" }],
]);
const elementCache = new Map();
const commentCalls = [];
const designCalls = [];
const projectCollections = (values, options, dependencies) => ({
  commentIndex: new Map(values.map((comment, index) => [comment.id, index + 1])),
  pageComments: values.filter(dependencies.isCurrentPage),
  designChanges: [{ id: "design-one" }],
  mergedDesignChanges: [{ id: "design-one" }, { id: "design-hidden" }],
  visibleDesignChanges: [{ id: "design-one" }, { id: "design-hidden" }],
  hasComments: dependencies.hasComments(values),
  isDesignMode: options.canUseTweaks,
});
const projected = projectAnnotationCurrentPageTargets(comments, {
  activeDesignChange: null,
  canUseTweaks: true,
  isOriginalViewEnabled: false,
  annotationEditorMode: "design",
  rootHost: "root",
  previewCommentId: "moving",
  observedTextAnchors,
}, {
  projectCollections,
  isCurrentPage: (comment) => comment.current,
  hasComments: (values) => values.length > 0,
  emptyCollection: [],
  getElementCache: (rootHost) => {
    assert.equal(rootHost, "root");
    return elementCache;
  },
  projectCommentTarget: (comment, cache, isPreview, observedAnchor) => {
    commentCalls.push({ comment, cache, isPreview, observedAnchor });
    return comment.id === "fixed" ? { ...comment, anchor: fixedAnchor } : { ...comment, anchor: movingAnchor };
  },
  refreshDesignTarget: (change, cache) => {
    designCalls.push({ change, cache });
    return change.id === "design-hidden" ? null : { id: change.id, live: true };
  },
});

assert.equal(projected.elementCache, elementCache);
assert.deepEqual([...projected.commentIndex.entries()], [["fixed", 1], ["moving", 2], ["off-page", 3]]);
assert.deepEqual(projected.pageComments.map((comment) => comment.id), ["fixed", "moving"]);
assert.deepEqual(projected.visiblePageComments.map((comment) => comment.id), ["fixed", "moving"]);
assert.equal(commentCalls[0].observedAnchor, "observed-fixed");
assert.equal(commentCalls[1].observedAnchor, null);
assert.equal(commentCalls[1].isPreview, true);
assert.equal(commentCalls.every((call) => call.cache === elementCache), true);
assert.deepEqual(projected.visibleDesignTargets, [{ id: "design-one", live: true }]);
assert.equal(designCalls.every((call) => call.cache === elementCache), true);
assert.equal(projected.observeDocumentScroll, true);
assert.equal(projected.observeMutations, true);
assert.equal(projected.hasComments, true);
assert.equal(projected.isDesignMode, true);

await fs.rm(temporaryDirectory, { recursive: true, force: true });
console.log("14 preload annotation current-page target projection assertions passed");
