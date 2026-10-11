import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveAnnotationTextTarget } = require("../app/.vite/build/browser-page-preload/annotation-text-target.js");
const root = {};
const element = {};
const container = {};

assert.equal(
  resolveAnnotationTextTarget(1, 2, root, {
    hitTest: () => element,
    getContainerAncestor: (value) => value === element ? container : null,
  }),
  container,
);
assert.equal(
  resolveAnnotationTextTarget(1, 2, root, {
    hitTest: () => null,
    getContainerAncestor: () => container,
  }),
  null,
);

console.log("2 preload annotation text target assertions passed");
