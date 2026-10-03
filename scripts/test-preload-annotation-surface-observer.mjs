import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { installAnnotationSurfaceObserver } = require("../app/.vite/build/browser-page-preload/annotation-surface-observer.js");

class FakeElement {
  constructor(documentRef, attributes = {}) { this.ownerDocument = documentRef; this.isConnected = true; this.attributes = new Set(Object.keys(attributes)); this.values = attributes; this.children = []; this.shadowRoot = null; }
  hasAttribute(name) { return this.attributes.has(name); }
  getAttribute(name) { return this.values[name] ?? null; }
  querySelectorAll() { return this.children; }
}
class FakeTarget extends FakeElement {}
class FakeDocument {
  body = {};
  documentElement = {};
  elements = [];
  listeners = new Map();
  querySelectorAll() { return this.elements; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  emit(type, event = {}) { this.listeners.get(type)?.({ composedPath: () => [this.elements[0]], ...event }); }
}
class FakeWindow {
  listeners = new Map();
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  emit(type) { this.listeners.get(type)?.({}); }
}
class FakeMutationObserver {
  static all = [];
  constructor(callback) { this.callback = callback; this.disconnected = false; FakeMutationObserver.all.push(this); }
  observe(target, options) { this.target = target; this.options = options; }
  disconnect() { this.disconnected = true; }
  emit(records) { if (!this.disconnected) this.callback(records); }
}

const documentRef = new FakeDocument();
const windowRef = new FakeWindow();
const container = new FakeTarget(documentRef, { "oai-annotation-container": "" });
const metadata = new FakeTarget(documentRef, { "oai-annotatable": "", "oai-annotation-metadata": '{"source":"test"}' });
documentRef.elements = [container, metadata];
const featureEvents = [];
let shadowCleanupCalls = 0;
const observer = installAnnotationSurfaceObserver({
  documentRef,
  windowRef,
  elementConstructor: FakeElement,
  htmlElementConstructor: FakeElement,
  mutationObserverConstructor: FakeMutationObserver,
  shadowEvent: "shadow-attached",
  containersAttribute: "oai-annotation-container",
  containerTextAttribute: "oai-annotation-container-text",
  metadataAttribute: "oai-annotation-metadata",
  annotatableAttribute: "oai-annotatable",
  observerOptions: { childList: true, subtree: true, attributes: true },
  parseMetadata: (value) => value === '{"source":"test"}' ? { source: "test" } : undefined,
  executeInMainWorld: () => () => { shadowCleanupCalls += 1; },
  onFeaturesChanged: (features) => featureEvents.push(features),
});

assert.deepEqual(featureEvents.at(-1).sort(), ["containers", "metadata-with-targets"]);
observer.recordUse("requests");
assert.deepEqual(featureEvents.at(-1).sort(), ["containers", "metadata-with-targets", "requests"]);
observer.recordUse("requests-with-prompts");
assert.equal(featureEvents.at(-1).includes("requests"), false);
assert.equal(featureEvents.at(-1).includes("requests-with-prompts"), true);
observer.recordUse("requests");
assert.equal(featureEvents.at(-1).includes("requests"), false);
windowRef.emit("pageshow");
assert.equal(featureEvents.at(-1).includes("requests-with-prompts"), true);

container.isConnected = false;
FakeMutationObserver.all[0].emit([{ type: "attributes", target: container, addedNodes: [] }]);
assert.equal(featureEvents.at(-1).includes("containers"), false);
const added = new FakeTarget(documentRef, { "oai-annotation-container-text": "" });
FakeMutationObserver.all[0].emit([{ type: "childList", target: documentRef, addedNodes: [added] }]);
assert.equal(featureEvents.at(-1).includes("containers"), true);
observer.dispose();
assert.equal(shadowCleanupCalls, 1);
assert.equal(FakeMutationObserver.all.every((entry) => entry.disconnected), true);
const eventCountAfterDispose = featureEvents.length;
observer.recordUse("metadata");
windowRef.emit("pageshow");
assert.equal(featureEvents.length, eventCountAfterDispose);
assert.deepEqual(featureEvents.at(-1), []);

console.log("13 preload annotation surface observer assertions passed");
