import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationTextPreviewState } = require("../app/.vite/build/browser-page-preload/annotation-text-preview-state.js");

const activeText = { annotation: { anchor: { kind: "text", id: "active" } } };
const draftText = { anchor: { type: "text", value: { kind: "text", id: "draft" } } };
const selectedText = { anchor: { kind: "text", id: "selected" } };
const deps = {
  resolveTextAnchor: (anchor) => anchor.id === "draft" ? null : { resolved: anchor.id },
  resolveSelectionRects: (anchor) => [{ id: anchor.id }],
};

const active = projectAnnotationTextPreviewState({ active: activeText, hasActiveSelection: true, draft: draftText, isSuspended: false, areMarkersVisible: true, selectedComment: selectedText }, deps);
assert.equal(active.anchor, activeText.annotation.anchor);
assert.deepEqual(active.resolvedAnchor, { resolved: "active" });
assert.deepEqual(active.selectionRects, []);

const draft = projectAnnotationTextPreviewState({ active: null, hasActiveSelection: false, draft: draftText, isSuspended: false, areMarkersVisible: true, selectedComment: selectedText }, deps);
assert.equal(draft.anchor, draftText.anchor.value);
assert.equal(draft.resolvedAnchor, null);
assert.deepEqual(draft.selectionRects, [{ id: "draft" }]);

const selected = projectAnnotationTextPreviewState({ active: null, hasActiveSelection: false, draft: null, isSuspended: false, areMarkersVisible: true, selectedComment: selectedText }, deps);
assert.equal(selected.anchor, selectedText.anchor);
assert.deepEqual(selected.resolvedAnchor, { resolved: "selected" });
assert.deepEqual(selected.selectionRects, []);

const hidden = projectAnnotationTextPreviewState({ active: null, hasActiveSelection: false, draft: null, isSuspended: false, areMarkersVisible: false, selectedComment: selectedText }, deps);
assert.equal(hidden.anchor, null);
assert.deepEqual(hidden.selectionRects, []);
const suspended = projectAnnotationTextPreviewState({ active: null, hasActiveSelection: false, draft: draftText, isSuspended: true, areMarkersVisible: true, selectedComment: selectedText }, deps);
assert.equal(suspended.anchor, null);
console.log("12 preload annotation text-preview-state assertions passed");
