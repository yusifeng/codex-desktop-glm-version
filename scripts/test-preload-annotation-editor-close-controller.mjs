import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { closeAnnotationEditor } = require("../app/.vite/build/browser-page-preload/annotation-editor-close-controller.js");

const events = [];
let editorState = { target: { mode: "edit", commentId: "one" } };
closeAnnotationEditor({ mode: "edit", commentId: "one" }, {
  clearInteraction: () => events.push("interaction"),
  clearTransientState: () => events.push("transient"),
  flushSync: (callback) => { events.push("flush:start"); callback(); events.push("flush:end"); },
  resetModifierState: () => events.push("modifier"),
  clearPointerState: () => events.push("pointer"),
  clearViewportSelection: () => events.push("viewport"),
  clearDesignScrub: () => events.push("scrub"),
  clearPreparedScreenshot: () => events.push("screenshot"),
  clearHover: () => events.push("hover"),
  clearSelectionHover: () => events.push("selection-hover"),
  clearDragState: () => events.push("drag"),
  clearEditorRef: () => events.push("editor-ref"),
  nextInteractionGeneration: () => events.push("generation"),
  setEditorState: (update) => { editorState = update(editorState); },
  matchesTarget: (state, target) => state.target.mode === target.mode && state.target.commentId === target.commentId,
});
assert.deepEqual(events, ["interaction", "transient", "flush:start", "modifier", "pointer", "generation", "viewport", "scrub", "screenshot", "hover", "selection-hover", "drag", "editor-ref", "flush:end"]);
assert.equal(editorState, null);

editorState = { target: { mode: "design" } };
closeAnnotationEditor({ mode: "edit", commentId: "one" }, {
  clearInteraction: () => {}, clearTransientState: () => {}, flushSync: (callback) => callback(),
  resetModifierState: () => {}, clearPointerState: () => {}, clearViewportSelection: () => {}, clearDesignScrub: () => {},
  clearPreparedScreenshot: () => {}, clearHover: () => {}, clearSelectionHover: () => {}, clearDragState: () => {},
  clearEditorRef: () => {}, nextInteractionGeneration: () => {}, setEditorState: (update) => { editorState = update(editorState); },
  matchesTarget: () => false,
});
assert.deepEqual(editorState, { target: { mode: "design" } });
console.log("16 preload annotation editor-close-controller assertions passed");
