import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { normalizeAnnotationControlTargets } = require("../app/.vite/build/browser-page-preload/annotation-control-target-validation.js");
class FakeElement { constructor(ownerDocument) { this.ownerDocument = ownerDocument; } }
const documentRef = {};
const first = new FakeElement(documentRef);
const second = new FakeElement(documentRef);
assert.deepEqual(normalizeAnnotationControlTargets(first, FakeElement, documentRef, 2), [first]);
assert.deepEqual(normalizeAnnotationControlTargets([first, first, second], FakeElement, documentRef, 3), [first, second]);
assert.throws(() => normalizeAnnotationControlTargets(null, FakeElement, documentRef, 2), /require element targets/);
assert.throws(() => normalizeAnnotationControlTargets([first, second, first], FakeElement, documentRef, 2), /Too many/);
assert.throws(() => normalizeAnnotationControlTargets([new FakeElement({})], FakeElement, documentRef, 2), /belong to this document/);
assert.throws(() => normalizeAnnotationControlTargets([{}], FakeElement, documentRef, 2), /belong to this document/);
console.log("6 preload annotation control target validation assertions passed");
