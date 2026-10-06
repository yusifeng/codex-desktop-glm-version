import assert from "node:assert/strict";
import { isAnnotationIframeElement } from "../app/.vite/build/browser-page-preload/annotation-iframe-element-policy.js";

class Iframe {}
const deps = { getOwnerWindow: () => ({ HTMLIFrameElement: Iframe }), getFallbackIframe: () => null };
assert.equal(isAnnotationIframeElement(new Iframe(), deps), true);
assert.equal(isAnnotationIframeElement({ tagName: `IFRAME`, contentWindow: {} }, deps), true);
assert.equal(isAnnotationIframeElement({ tagName: `DIV`, contentWindow: {} }, deps), false);
assert.equal(isAnnotationIframeElement(null, deps), false);
console.log(`test-preload-annotation-iframe-element-policy: 4 assertions passed`);
