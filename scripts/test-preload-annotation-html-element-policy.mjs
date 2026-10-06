import assert from "node:assert/strict";
import { isAnnotationHtmlElement } from "../app/.vite/build/browser-page-preload/annotation-html-element-policy.js";
class Element {}
const deps = { getOwnerWindow: () => ({ HTMLElement: Element }), getFallbackHTMLElement: () => null };
assert.equal(isAnnotationHtmlElement(new Element(), deps), true);
assert.equal(isAnnotationHtmlElement({}, deps), false);
assert.equal(isAnnotationHtmlElement(null, deps), false);
console.log(`test-preload-annotation-html-element-policy: 3 assertions passed`);
