import assert from "node:assert/strict";
import { resolveAnnotationFrameElement } from "../app/.vite/build/browser-page-preload/annotation-frame-element-resolver.js";
const frame = { kind: `iframe` };
const deps = { querySelector: (_documentLike, selector) => selector === `frame` ? frame : null, isIframe: (value) => value?.kind === `iframe` };
assert.equal(resolveAnnotationFrameElement({}, `frame`, deps), frame);
assert.equal(resolveAnnotationFrameElement({}, `missing`, deps), null);
assert.equal(resolveAnnotationFrameElement({}, `frame`, { ...deps, isIframe: () => false }), null);
console.log(`test-preload-annotation-frame-element-resolver: 3 assertions passed`);
