import assert from "node:assert/strict";

import { isAnnotationElementFixedOrSticky } from "../app/.vite/build/browser-page-preload/annotation-fixed-position-policy.js";

const mainWindow = { document: {} };
const body = {};
const root = { position: `static`, parent: body };
const child = { position: `fixed`, parent: root };
const deps = {
  getOwnerWindow: () => mainWindow,
  currentWindow: mainWindow,
  getDocumentBody: () => body,
  getParent: (element) => element.parent ?? null,
  getPosition: (element) => element.position,
};

assert.equal(isAnnotationElementFixedOrSticky(child, deps), true);
assert.equal(isAnnotationElementFixedOrSticky({ position: `sticky`, parent: root }, deps), true);
assert.equal(isAnnotationElementFixedOrSticky(root, deps), false);
assert.equal(
  isAnnotationElementFixedOrSticky(child, { ...deps, getOwnerWindow: () => ({}) }),
  false,
);

console.log(`test-preload-annotation-fixed-position-policy: 4 assertions passed`);
