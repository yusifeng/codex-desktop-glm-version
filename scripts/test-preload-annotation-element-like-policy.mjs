import assert from "node:assert/strict";
import { isAnnotationElementLike } from "../app/.vite/build/browser-page-preload/annotation-element-like-policy.js";

class Element {}
class Node {}
const deps = { getOwnerWindow: () => ({ HTMLElement: Element, Node }), getFallbackHTMLElement: () => null, getFallbackNode: () => null, getElementNodeType: () => 1 };
assert.equal(isAnnotationElementLike(new Element(), deps), true);
assert.equal(isAnnotationElementLike({ nodeType: 1, ownerDocument: {}, getBoundingClientRect() {}, tagName: `DIV` }, deps), true);
assert.equal(isAnnotationElementLike({ nodeType: 3, ownerDocument: {}, tagName: `#text` }, deps), false);
assert.equal(isAnnotationElementLike(null, deps), false);
console.log(`test-preload-annotation-element-like-policy: 4 assertions passed`);
