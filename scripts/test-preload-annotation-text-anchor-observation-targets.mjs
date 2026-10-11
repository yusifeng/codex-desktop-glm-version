import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { collectAnnotationTextAnchorObservationTargets } = require("../app/.vite/build/browser-page-preload/annotation-text-anchor-observation-targets.js");

const documentElement = { kind: "document-element" };
const frame = { documentElement };
const root = { kind: "root" };
const parent = { kind: "parent", parentNode: null, parentElement: null, getRootNode: () => root };
const target = { kind: "target", parentNode: parent, parentElement: parent, getRootNode: () => root, addEventListener() {} };
const dependencies = {
  collectFrameWindows: () => [frame],
  resolveFrameWindow: () => frame,
  resolveTextTarget: () => target,
  resolveFallbackRoot: () => root,
  isShadowRoot: (value) => value === root,
  getShadowHost: () => null,
  getParentNode: (value) => value.parentNode,
  getParentElement: (value) => value.parentElement,
  getRootNode: (value) => value.getRootNode(),
  isElement: (value) => value === target || value === parent,
  getDocumentElement: (value) => value.documentElement,
};

const projected = collectAnnotationTextAnchorObservationTargets([{ framePath: [], textLocator: {} }], dependencies);
assert.equal(projected.inputTargets.has(target), true);
assert.equal(projected.mutationTargets.has(target), true);
assert.equal(projected.mutationAncestors.has(parent), true);
assert.equal(projected.scrollTargets.has(target), true);
assert.equal(projected.frameWindows.has(frame), true);
assert.equal(projected.hasUnresolved, false);

const fallback = { kind: "fallback" };
const unresolved = collectAnnotationTextAnchorObservationTargets([{ framePath: ["missing"], textLocator: {} }], {
  ...dependencies,
  collectFrameWindows: (framePath) => framePath[0] === "missing" ? [] : [frame],
  resolveFrameWindow: () => null,
  resolveFallbackRoot: () => fallback,
  isShadowRoot: () => false,
});
assert.equal(unresolved.hasUnresolved, true);
assert.equal(unresolved.mutationTargets.size, 0);

const unresolvedInFrame = collectAnnotationTextAnchorObservationTargets([{ framePath: [], textLocator: {} }], {
  ...dependencies,
  resolveTextTarget: () => null,
  resolveFallbackRoot: () => root,
  isShadowRoot: (value) => value === root,
});
assert.equal(unresolvedInFrame.hasUnresolved, true);
assert.equal(unresolvedInFrame.mutationTargets.has(root), true);
assert.equal(unresolvedInFrame.frameWindows.has(root), true);
console.log("11 preload annotation text-anchor observation-target assertions passed");
