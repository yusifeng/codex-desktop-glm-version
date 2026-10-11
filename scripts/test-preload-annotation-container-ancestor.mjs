import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveAnnotationContainerAncestor } = require("../app/.vite/build/browser-page-preload/annotation-container-ancestor.js");
const documentLike = {}, textContainer = { ownerDocument: documentLike, attrs: ["oai-annotation-container-text"], parentElement: null }, container = { ownerDocument: documentLike, attrs: ["oai-annotation-container"], parentElement: null }, child = { ownerDocument: documentLike, attrs: [], parentElement: textContainer };
const deps = { getOwnerDocument: (e) => e?.ownerDocument, getParent: (e) => e.parentElement, hasAttribute: (e, n) => e.attrs?.includes(n) ?? false };
assert.equal(resolveAnnotationContainerAncestor(child, deps), textContainer); assert.equal(resolveAnnotationContainerAncestor({ ...child, parentElement: container }, deps), null); assert.equal(resolveAnnotationContainerAncestor({ ...child, parentElement: null }, deps), null);
console.log("3 preload annotation container ancestor assertions passed");
