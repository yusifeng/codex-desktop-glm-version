import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { observeAnnotationShadowRoots } = require("../app/.vite/build/browser-page-preload/annotation-shadow-root-observer.js");

class Element {
  constructor(ownerDocument, connected = true) { this.ownerDocument = ownerDocument; this.isConnected = connected; this.shadowRoot = null; this.children = []; this.events = new Map(); }
  querySelectorAll() { return this.children; }
  matches() { return false; }
  addEventListener(type, fn) { this.events.set(type, fn); }
  removeEventListener(type, fn) { if (this.events.get(type) === fn) this.events.delete(type); }
  emit(type) { this.events.get(type)?.({ composedPath: () => [this] }); }
}
class Observer {
  static all = [];
  constructor(callback) { this.callback = callback; this.disconnected = false; Observer.all.push(this); }
  observe(target) { this.targets ??= []; this.targets.push(target); }
  disconnect() { this.disconnected = true; }
  emit(records) { if (!this.disconnected) this.callback(records); }
}
const documentRef = {};
const root = new Element(documentRef);
const host = new Element(documentRef);
const shadow = new Element(documentRef);
host.shadowRoot = shadow;
shadow.host = host;
root.children = [host];
let changes = 0;
const stop = observeAnnotationShadowRoots(root, () => changes++, {
  mutationObserverConstructor: Observer,
  observerOptions: { childList: true, subtree: true, attributes: true },
  selector: "[oai-annotation-container]",
  isElement: (value) => value instanceof Element,
  isIgnored: () => false,
  shadowEvent: "shadow-attached",
});
assert.equal(Observer.all[0].targets.length, 2);
const addedHost = new Element(documentRef);
const addedShadow = new Element(documentRef);
addedHost.shadowRoot = addedShadow;
addedShadow.host = addedHost;
Observer.all[0].emit([{ type: "childList", addedNodes: [addedHost], removedNodes: [] }]);
assert.ok(Observer.all[0].targets.includes(addedShadow));
assert.equal(changes, 1);
root.emit("shadow-attached");
assert.equal(changes, 2);
shadow.isConnected = false;
Observer.all[0].emit([{ type: "attributes", target: root, addedNodes: [], removedNodes: [] }]);
assert.equal(changes, 3);
stop();
assert.equal(Observer.all[0].disconnected, true);
console.log("4 preload annotation shadow-root observer assertions passed");
