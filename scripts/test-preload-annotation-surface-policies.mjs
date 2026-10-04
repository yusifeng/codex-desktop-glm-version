import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isValidAnnotationSurfaceElement, shouldDisposeAnnotationRegistryOnPagehide, shouldRenderAnnotationSelection } = require("../app/.vite/build/browser-page-preload/annotation-surface-policies.js");

assert.equal(shouldDisposeAnnotationRegistryOnPagehide({ isTrusted: true, persisted: false }), true);
assert.equal(shouldDisposeAnnotationRegistryOnPagehide({ isTrusted: true, persisted: true }), false);
assert.equal(shouldDisposeAnnotationRegistryOnPagehide({ isTrusted: false, persisted: false }), false);

const documentRef = {};
class FakeHtmlElement {
  constructor(ownerDocument, connected = true) { this.ownerDocument = ownerDocument; this.isConnected = connected; }
  getRootNode() { return this.ownerDocument; }
}
class FakeIFrame extends FakeHtmlElement {}
assert.equal(isValidAnnotationSurfaceElement(new FakeHtmlElement(documentRef), documentRef, FakeHtmlElement, FakeIFrame), true);
assert.equal(isValidAnnotationSurfaceElement(new FakeHtmlElement(documentRef, false), documentRef, FakeHtmlElement, FakeIFrame), false);
assert.equal(isValidAnnotationSurfaceElement(new FakeIFrame(documentRef), documentRef, FakeHtmlElement, FakeIFrame), false);
assert.equal(isValidAnnotationSurfaceElement(new FakeHtmlElement({}), documentRef, FakeHtmlElement, FakeIFrame), false);

const empty = { hoveredId: null, selectedId: null };
assert.equal(shouldRenderAnnotationSelection(empty, { hoveredId: "h", selectedId: null }, false, true), true);
assert.equal(shouldRenderAnnotationSelection({ hoveredId: "h", selectedId: null }, { hoveredId: "h", selectedId: null }, false, true), false);
assert.equal(shouldRenderAnnotationSelection(empty, { hoveredId: "h", selectedId: null }, true, true), false);
assert.equal(shouldRenderAnnotationSelection(empty, { hoveredId: "h", selectedId: null }, false, false), false);

console.log("test-preload-annotation-surface-policies: 11 assertions passed");
