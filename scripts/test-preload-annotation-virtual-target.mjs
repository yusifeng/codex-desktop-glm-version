import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createVirtualAnnotationTarget } = require("../app/.vite/build/browser-page-preload/annotation-virtual-target.js");
const target = createVirtualAnnotationTarget({ hit: { registrationId: "surface-1", id: "button-1", name: "Save", role: "button", metadata: { source: "test" } }, point: { x: 25, y: 40 }, pageUrl: "https://example.test", title: "Document", viewportWidth: 100 });
assert.equal(target.kind, "virtual");
assert.equal(target.title, "Save");
assert.equal(target.point.xPercent, 25);
assert.deepEqual(target.rect, { x: 25, y: 40, width: 1, height: 1 });
const fallback = createVirtualAnnotationTarget({ hit: { registrationId: "surface-1", id: "button-1" , rect: { x: 1, y: 2, width: 3, height: 4 } }, point: { x: 5, y: 6 }, pageUrl: "https://example.test", title: "Document", viewportWidth: 10 });
assert.equal(fallback.title, "Document");
assert.deepEqual(fallback.rect, { x: 1, y: 2, width: 3, height: 4 });

console.log("6 preload annotation virtual target assertions passed");
