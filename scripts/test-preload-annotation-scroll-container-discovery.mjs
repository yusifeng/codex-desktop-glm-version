import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { discoverAnnotationScrollContainers } = require("../app/.vite/build/browser-page-preload/annotation-scroll-container-discovery.js");
const body = {}, documentElement = {}, windowLike = { document: { body, documentElement } }, scrollParent = { parent: body, scrollLeft: 4, scrollTop: 8 }, child = { parent: scrollParent };
const deps = { getOwnerWindow: () => windowLike, getParent: (e) => e.parent, getBody: (w) => w.document.body, getDocumentElement: (w) => w.document.documentElement, isClippingBoundary: (e) => e === scrollParent, getSelector: (e) => e === scrollParent ? ".scroll" : null, getScrollLeft: (e) => e.scrollLeft, getScrollTop: (e) => e.scrollTop };
assert.deepEqual(discoverAnnotationScrollContainers(child, {}, deps), [{ selector: ".scroll", scrollLeft: 4, scrollTop: 8 }]); assert.deepEqual(discoverAnnotationScrollContainers(scrollParent, { includeElement: true }, deps), [{ selector: ".scroll", scrollLeft: 4, scrollTop: 8 }]); assert.deepEqual(discoverAnnotationScrollContainers(child, { includeElement: true }, { ...deps, isClippingBoundary: () => false }), []);
console.log("3 preload annotation scroll container discovery assertions passed");
