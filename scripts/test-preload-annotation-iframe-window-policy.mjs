import assert from "node:assert/strict";
import { resolveAnnotationIframeWindow } from "../app/.vite/build/browser-page-preload/annotation-iframe-window-policy.js";

const childWindow = { document: {} };
const deps = { isIframe: (value) => value?.kind === `iframe` };
assert.equal(resolveAnnotationIframeWindow({ kind: `div`, contentWindow: childWindow }, deps), null);
assert.equal(resolveAnnotationIframeWindow({ kind: `iframe`, contentWindow: childWindow }, deps), childWindow);
assert.equal(resolveAnnotationIframeWindow({ kind: `iframe`, contentWindow: {} }, deps), null);
assert.equal(resolveAnnotationIframeWindow({ kind: `iframe`, get contentWindow() { throw new Error(`cross-origin`); } }, deps), null);
console.log(`test-preload-annotation-iframe-window-policy: 4 assertions passed`);
