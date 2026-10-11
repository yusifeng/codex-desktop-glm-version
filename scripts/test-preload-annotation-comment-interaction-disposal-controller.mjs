import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationCommentInteractionDisposalController } = require(
  "../app/.vite/build/browser-page-preload/annotation-comment-interaction-disposal-controller.js",
);

const events = [];
const controller = createAnnotationCommentInteractionDisposalController({
  disposeInteraction: () => events.push("interaction"),
  resetModifier: () => events.push("modifier"),
  clearPointer: () => events.push("pointer"),
  clearHover: () => events.push("hover"),
  clearSelectionHover: () => events.push("selection-hover"),
  clearTransientState: () => events.push("transient"),
  clearViewportSelection: () => events.push("viewport-selection"),
  nextInteractionGeneration: () => events.push("generation"),
  clearDragState: () => events.push("drag"),
});
controller.dispose();
assert.deepEqual(events, [
  "interaction",
  "modifier",
  "pointer",
  "hover",
  "selection-hover",
  "transient",
  "viewport-selection",
  "generation",
  "drag",
]);
controller.dispose();
assert.equal(events.length, 18);
console.log("11 preload annotation comment-interaction-disposal-controller assertions passed");
