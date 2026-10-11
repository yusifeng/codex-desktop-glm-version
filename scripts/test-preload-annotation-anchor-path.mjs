import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getAnnotationAnchorPath } = require("../app/.vite/build/browser-page-preload/annotation-anchor-path.js");
const documentRoot = { kind: "document" };
const host = { kind: "host" };
const shadowRoot = { kind: "shadow", host };
const element = { kind: "element" };

assert.equal(
  getAnnotationAnchorPath(element, {}, {
    generateSelector: (value) => value === element ? "#target" : "#host",
    getRootNode: () => documentRoot,
    isDocumentRoot: (root) => root === documentRoot,
    isShadowRoot: () => false,
    getHost: () => host,
    shadowPrefix: "shadow:",
    shadowSeparator: ">>>",
  }),
  "#target",
);
assert.equal(
  getAnnotationAnchorPath(element, {}, {
    generateSelector: (value) => value === element ? ".inner" : ".host",
    getRootNode: (value) => value === element ? shadowRoot : documentRoot,
    isDocumentRoot: (root) => root === documentRoot,
    isShadowRoot: (root) => root === shadowRoot,
    getHost: (root) => root.host,
    shadowPrefix: "shadow:",
    shadowSeparator: ">>>",
  }),
  "shadow:.host>>>.inner",
);
assert.equal(
  getAnnotationAnchorPath(element, {}, {
    generateSelector: () => null,
    getRootNode: () => documentRoot,
    isDocumentRoot: () => true,
    isShadowRoot: () => false,
    getHost: () => null,
    shadowPrefix: "shadow:",
    shadowSeparator: ">>>",
  }),
  null,
);

console.log("3 preload annotation anchor path assertions passed");
