import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getMountedAnnotationMessageAction,
  getPreMountAnnotationMessageAction,
} = require("../app/.vite/build/browser-page-preload/annotation-host-message-routing.js");

assert.equal(getPreMountAnnotationMessageAction("browser-sidebar-runtime-annotation-permission-result"), "permission-result");
assert.equal(getPreMountAnnotationMessageAction("browser-site-annotation-feature-preview"), "preview");
assert.equal(getPreMountAnnotationMessageAction("browser-sidebar-runtime-sync"), "sync");
assert.equal(getPreMountAnnotationMessageAction("browser-sidebar-runtime-capture-text-selection"), "capture-text-selection");

for (const type of [
  "browser-sidebar-runtime-select-comment",
  "browser-sidebar-runtime-create-comment-at-point",
  "browser-sidebar-runtime-create-comment-from-selection",
  "browser-sidebar-runtime-open-design-editor-at-point",
  "browser-sidebar-runtime-restore-editor",
]) {
  assert.equal(getPreMountAnnotationMessageAction(type), "queue-editor-message");
}
assert.equal(getPreMountAnnotationMessageAction("browser-sidebar-runtime-close-editor"), "close-editor");
for (const type of [
  "browser-sidebar-runtime-design-scrub-changed",
  "browser-sidebar-runtime-annotation-selection-hover-state",
  "browser-sidebar-runtime-annotation-selection-modifier-state",
  "browser-sidebar-runtime-remove-annotation-selection",
  "browser-sidebar-runtime-prepare-comment-screenshot",
  "browser-sidebar-runtime-clear-comment-screenshot",
  "unknown",
]) {
  assert.equal(getPreMountAnnotationMessageAction(type), "ignore");
}

assert.equal(getMountedAnnotationMessageAction("browser-sidebar-runtime-sync"), "sync");
for (const type of [
  "browser-sidebar-runtime-prepare-comment-screenshot",
  "browser-sidebar-runtime-clear-comment-screenshot",
  "browser-sidebar-runtime-capture-text-selection",
  "browser-sidebar-runtime-select-comment",
  "browser-sidebar-runtime-close-editor",
  "browser-sidebar-runtime-design-scrub-changed",
  "browser-sidebar-runtime-create-comment-at-point",
  "browser-sidebar-runtime-create-comment-from-selection",
  "browser-sidebar-runtime-open-design-editor-at-point",
  "browser-sidebar-runtime-annotation-selection-hover-state",
  "browser-sidebar-runtime-annotation-selection-modifier-state",
  "browser-sidebar-runtime-remove-annotation-selection",
  "browser-sidebar-runtime-restore-editor",
]) {
  assert.equal(getMountedAnnotationMessageAction(type), "forward");
}
assert.equal(getMountedAnnotationMessageAction("browser-sidebar-runtime-annotation-permission-result"), "ignore");
assert.equal(getMountedAnnotationMessageAction("browser-site-annotation-feature-preview"), "ignore");
assert.equal(getMountedAnnotationMessageAction("unknown"), "ignore");

console.log("34 annotation host message routing assertions passed");
