import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationSurfaceRegistry } = require("../app/.vite/build/browser-page-preload/annotation-surface-registry.js");

class FakeDocument {
  listeners = new Map();
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  dispatch(type, target, detail) { this.listeners.get(type)?.({ target, detail, isTrusted: true }); }
}
class FakeWindow { addEventListener() {} removeEventListener() {} }
class FakeMutationObserver {
  static all = [];
  constructor(callback) { this.callback = callback; this.disconnected = false; FakeMutationObserver.all.push(this); }
  observe(target, options) { this.target = target; this.options = options; }
  disconnect() { this.disconnected = true; }
}
const documentRef = new FakeDocument();
const windowRef = new FakeWindow();
const surface = { isConnected: true, ownerDocument: documentRef, getBoundingClientRect: () => ({ x: 0, y: 0, width: 100, height: 100 }) };
const requests = [];
const invalidated = [];
const failed = [];
let id = 0;
const registry = createAnnotationSurfaceRegistry({
  documentRef,
  windowRef,
  mutationObserverConstructor: FakeMutationObserver,
  responseEvent: "response",
  requestEvent: "request",
  maxPayloadLength: 1000,
  deadlineMs: 100,
  isValidSurface: (element) => element?.isConnected === true && element.ownerDocument === documentRef,
  getElementAtPoint: () => surface,
  parseResponse: (detail) => JSON.parse(detail),
  createRequestId: () => `request-${++id}`,
  clipRect: (element, rect) => rect,
  normalizeName: (value) => value,
  normalizeRole: (value) => value,
  sanitizeMetadata: (value) => value,
  dispatchRequest: (target, payload) => requests.push([target, payload]),
  isResponseEvent: (event) => event.isTrusted === true,
  onInvalidated: (element) => invalidated.push(element),
  onRenderingFailed: (element) => failed.push(element),
});

assert.equal(registry.hasSurface(surface), false);
documentRef.dispatch("response", surface, JSON.stringify({ type: "registered", registrationId: "surface-1", customRendering: true }));
assert.equal(registry.hasSurface(surface), true);
assert.equal(requests.length, 0);
assert.equal(registry.renderSelection(surface, "surface-1", { hoveredId: "hit-1" }), true);
assert.deepEqual(requests.at(-1)[1], { type: "render", registrationId: "surface-1", hoveredId: "hit-1" });
const hitPromise = registry.hitTest(surface, { x: 10, y: 20 });
assert.deepEqual(requests.at(-1)[1].type, "hit-test");
const requestId = requests.at(-1)[1].requestId;
documentRef.dispatch("response", surface, JSON.stringify({ type: "result", registrationId: "surface-1", requestId, hit: { id: "hit-1", name: "Button", role: "button", metadata: { source: "test" }, rect: { x: 2, y: 3, width: 10, height: 11 } } }));
assert.deepEqual(await hitPromise, { registrationId: "surface-1", id: "hit-1", name: "Button", role: "button", metadata: { source: "test" }, rect: { x: 2, y: 3, width: 10, height: 11 }, customRendering: true });
documentRef.dispatch("response", surface, JSON.stringify({ type: "rendering-failed", registrationId: "surface-1" }));
assert.equal(failed.length, 1);
documentRef.dispatch("response", surface, JSON.stringify({ type: "disposed", registrationId: "surface-1" }));
assert.equal(registry.hasSurface(surface), false);
assert.equal(invalidated.length, 2);
registry.dispose();
assert.equal(documentRef.listeners.size, 0);

console.log("9 preload annotation surface registry assertions passed");
