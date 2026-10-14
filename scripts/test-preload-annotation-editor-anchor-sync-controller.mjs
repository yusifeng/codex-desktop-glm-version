import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "annotation-editor-anchor-sync-"));
const output = path.join(tempDir, "controller.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/browser-page-preload/annotation-editor-anchor-sync-controller.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const require = createRequire(import.meta.url);
const { createAnnotationEditorAnchorSyncController } = require(output);

function eventTarget(events, label) {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, callback, capture) {
      events.push([`add`, label, type, capture]);
      listeners.set(`${type}:${capture === true}`, callback);
    },
    removeEventListener(type, callback, capture) {
      events.push([`remove`, label, type, capture]);
      assert.equal(listeners.get(`${type}:${capture === true}`), callback);
      listeners.delete(`${type}:${capture === true}`);
    },
  };
}

function harness(overrides = {}) {
  const events = [];
  const messages = [];
  const stateUpdates = [];
  const viewport = eventTarget(events, "viewport");
  const frameWindow = eventTarget(events, "frame-window");
  const frameDocument = eventTarget(events, "frame-document");
  const targets = new Map();
  let frameCleanupCount = 0;
  let scrollCleanupCount = 0;
  let textCleanupCount = 0;
  let refreshCount = 0;
  let clearHoverCount = 0;
  let observedAnchors = null;
  let textAnchors = null;
  const controller = createAnnotationEditorAnchorSyncController({
    windowLike: { visualViewport: viewport },
    createTargetMap: () => targets,
    findComment: (comments, id) => comments.find((comment) => comment.id === id) ?? null,
    resolveCommentElement: () => ({ id: "comment-element" }),
    projectCommentAnchor: (comment, element, zoom) => ({ anchor: { kind: "element" }, comment, element, zoom }),
    serializeEditorAnchor: (editor, zoom, viewportScale) => ({ anchor: { kind: editor.anchor.type }, zoom, viewportScale }),
    projectEditAnchor: () => ({ anchor: { kind: "element" }, projected: true }),
    normalizeEditAnchor: (anchorState) => ({ ...anchorState, normalized: true }),
    resolveEditorElement: () => ({ id: "live-element" }),
    targetsEqual: (left, right) => left.mode === right.mode && left.commentId === right.commentId,
    textAnchorsEqual: (left, right) => left.id === right.id,
    sendAnchorUpdate: (target, anchorState) => messages.push({ target, anchorState }),
    refreshViewport: () => refreshCount++,
    updateEditorState: (update) => stateUpdates.push(update),
    clearCreateHover: () => clearHoverCount++,
    observeFrames: (install) => {
      const cleanup = install(frameDocument, frameWindow);
      return () => { frameCleanupCount++; cleanup(); };
    },
    observeScrollContainers: (_windowLike, anchors) => {
      observedAnchors = anchors;
      return () => { scrollCleanupCount++; };
    },
    observeTextAnchors: (anchors) => {
      textAnchors = anchors;
      return () => { textCleanupCount++; };
    },
    ...overrides,
  });
  return {
    controller,
    events,
    frameWindow,
    messages,
    stateUpdates,
    targets,
    counts: () => ({ frameCleanupCount, scrollCleanupCount, textCleanupCount, refreshCount, clearHoverCount }),
    anchors: () => ({ observedAnchors, textAnchors }),
  };
}

{
  const h = harness();
  h.controller.install({ editor: null, previewCommentId: null, comments: [], rootHost: {}, zoom: 1, viewportScale: 1 })();
  assert.equal(h.messages.length, 0);
  assert.equal(h.events.length, 0);
}

{
  const h = harness();
  const dispose = h.controller.install({
    editor: null,
    previewCommentId: "comment-1",
    comments: [{ id: "comment-1" }],
    rootHost: {},
    zoom: 2,
    viewportScale: 1,
  });
  assert.equal(h.messages.length, 1);
  assert.deepEqual(h.messages[0].target, { mode: "edit", commentId: "comment-1" });
  assert.equal(h.messages[0].anchorState.zoom, 2);
  assert.equal(h.targets.get("comment-1").id, "comment-element");
  assert.equal(h.counts().refreshCount, 1);
  dispose();
  dispose();
  assert.deepEqual(h.counts(), { frameCleanupCount: 1, scrollCleanupCount: 1, textCleanupCount: 0, refreshCount: 1, clearHoverCount: 0 });
  assert.equal(h.events.filter(([action]) => action === "remove").length, 5);
}

{
  const h = harness({ serializeEditorAnchor: () => ({ anchor: { kind: "text", id: "new" } }) });
  const editor = { target: { mode: "create" }, anchor: { type: "text", value: { id: "old" } } };
  const dispose = h.controller.install({ editor, previewCommentId: null, comments: [], rootHost: {}, zoom: 1, viewportScale: 2 });
  assert.deepEqual(h.anchors().observedAnchors, [{ id: "old" }]);
  assert.deepEqual(h.anchors().textAnchors, [{ id: "old" }]);
  const previous = { target: editor.target, anchor: { type: "text", value: { id: "old" } } };
  assert.equal(h.stateUpdates.length, 1);
  assert.equal(h.stateUpdates[0](previous).anchor.value.id, "new");
  dispose();
  assert.equal(h.counts().textCleanupCount, 1);
}

{
  const h = harness({ serializeEditorAnchor: () => null });
  const editor = { target: { mode: "create" }, anchor: { type: "element", value: { id: "anchor" }, additionalSelections: [] } };
  h.controller.install({ editor, previewCommentId: null, comments: [], rootHost: {}, zoom: 1, viewportScale: 1 });
  assert.equal(h.messages[0].anchorState, null);
  const previous = { target: editor.target, anchor: { type: "element", value: {}, element: { id: "stale" } } };
  assert.equal(h.stateUpdates[0](previous).anchor.element, null);
  h.frameWindow.listeners.get("scroll:false")();
  assert.equal(h.counts().clearHoverCount, 1);
}

{
  const h = harness();
  const editor = {
    target: { mode: "edit", commentId: "comment-2" },
    anchor: { type: "element", value: { id: "anchor" }, additionalSelections: [{ anchor: { id: "extra" } }] },
  };
  h.controller.install({ editor, previewCommentId: null, comments: [], rootHost: {}, zoom: 1, viewportScale: 1 });
  assert.equal(h.messages[0].anchorState.normalized, true);
  assert.deepEqual(h.anchors().observedAnchors, [{ id: "anchor" }, { id: "extra" }]);
  const previous = { target: editor.target, anchor: { type: "element", value: {}, element: null } };
  assert.equal(h.stateUpdates[0](previous).anchor.element.id, "live-element");
}

console.log("test-preload-annotation-editor-anchor-sync-controller: 20 assertions passed");
