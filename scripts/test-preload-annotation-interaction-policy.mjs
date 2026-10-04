import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isAnnotationInteractionBlocked, isAnnotationMarkerEvent, isAnnotationOverlayElement } = require("../app/.vite/build/browser-page-preload/annotation-interaction-policy.js");

const root = { id: "codex-root" };
const host = { id: "codex-root" };
const shadow = { host };
const make = (attrs = [], options = {}) => ({
  id: options.id,
  attrs: new Set(attrs),
  parent: options.parent ?? null,
  root: options.root ?? { host: null },
});
const deps = {
  isElement(value) { return value?.attrs instanceof Set || value === root || value === host; },
  closest(element) { return element.parent === root ? root : null; },
  getRootNode(element) { return element.root ?? {}; },
  isShadowRoot(value) { return value === shadow; },
  getShadowHost(value) { return value.host; },
  getComposedPath(event) { return event.path; },
  hasAttribute(element, attribute) { return element.attrs?.has(attribute) === true; },
};

assert.equal(isAnnotationOverlayElement(root, "codex-root", deps), true);
assert.equal(isAnnotationOverlayElement(make([], { parent: root }), "codex-root", deps), true);
assert.equal(isAnnotationOverlayElement(make([], { root: shadow }), "codex-root", deps), true);
assert.equal(isAnnotationOverlayElement(make(), "codex-root", deps), false);
assert.equal(isAnnotationInteractionBlocked({ path: [make(["data-browser-comment-interaction-blocker"])] }, "data-browser-comment-interaction-blocker", deps), true);
assert.equal(isAnnotationInteractionBlocked({ path: [make(["other"])] }, "data-browser-comment-interaction-blocker", deps), false);
assert.equal(isAnnotationMarkerEvent({ path: [make(["data-browser-comment-marker"])] }, "data-browser-comment-marker", deps), true);
assert.equal(isAnnotationMarkerEvent({ path: [make(["other"])] }, "data-browser-comment-marker", deps), false);

console.log("annotation interaction policy assertions: 8 passed");
