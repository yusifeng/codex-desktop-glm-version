import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { installAnnotationFramePointerGuard } = require("../app/.vite/build/browser-page-preload/annotation-frame-pointer-guard.js");

class FakeStyle {
  constructor(value = "auto", priority = "") { this.value = value; this.priority = priority; }
  getPropertyValue() { return this.value; }
  getPropertyPriority() { return this.priority; }
  setProperty(_name, value, priority) { this.value = value; this.priority = priority; }
}

class FakeRoot {
  constructor(elements = []) { this.elements = elements; this.listeners = new Map(); }
  querySelectorAll() { return this.elements; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  emit(type, target) { this.listeners.get(type)?.({ target }); }
}

class FakeElement extends FakeRoot {
  constructor({ frame = false, accessible = false, overlay = false, style = new FakeStyle(), shadowRoot = null } = {}) {
    super();
    this.frame = frame;
    this.accessible = accessible;
    this.overlay = overlay;
    this.style = style;
    this.shadowRoot = shadowRoot;
  }
}

class FakeMutationObserver {
  static instances = [];
  constructor(callback) { this.callback = callback; this.observed = []; this.disconnected = false; FakeMutationObserver.instances.push(this); }
  observe(target, options) { this.observed.push([target, options]); }
  disconnect() { this.disconnected = true; }
}

const crossOrigin = new FakeElement({ frame: true, style: new FakeStyle("auto", "") });
const accessible = new FakeElement({ frame: true, accessible: true, style: new FakeStyle("painted", "") });
const overlayFrame = new FakeElement({ frame: true, overlay: true, style: new FakeStyle("overlay", "") });
const shadowFrame = new FakeElement({ frame: true, style: new FakeStyle("shadow", "") });
const shadowRoot = new FakeRoot([shadowFrame]);
const shadowHost = new FakeElement({ shadowRoot });
const documentRoot = new FakeRoot([crossOrigin, accessible, overlayFrame, shadowHost]);
let refreshCount = 0;

const cleanup = installAnnotationFramePointerGuard({
  installAcrossFrames: (install) => install(documentRoot, {}, () => { refreshCount += 1; }),
  mutationObserverConstructor: FakeMutationObserver,
  isElement: (value) => value instanceof FakeElement,
  isFrame: (value) => value instanceof FakeElement && value.frame,
  getFrameWindow: (frame) => frame.accessible ? {} : null,
  isOverlayElement: (element) => element.overlay,
});

assert.deepEqual([crossOrigin.style.value, crossOrigin.style.priority], ["none", "important"]);
assert.deepEqual([accessible.style.value, accessible.style.priority], ["painted", ""]);
assert.deepEqual([overlayFrame.style.value, overlayFrame.style.priority], ["overlay", ""]);
assert.deepEqual([shadowFrame.style.value, shadowFrame.style.priority], ["none", "important"]);
assert.equal(FakeMutationObserver.instances[0].observed.length, 2);

const added = new FakeElement({ frame: true, style: new FakeStyle("added", "") });
FakeMutationObserver.instances[0].callback([{ addedNodes: [added] }]);
assert.deepEqual([added.style.value, added.style.priority], ["none", "important"]);
assert.equal(refreshCount, 1);

crossOrigin.accessible = true;
documentRoot.emit("load", crossOrigin);
assert.deepEqual([crossOrigin.style.value, crossOrigin.style.priority], ["auto", ""]);
assert.equal(refreshCount, 2);

added.style.setProperty("pointer-events", "page-change", "");
cleanup();
assert.equal(FakeMutationObserver.instances[0].disconnected, true);
assert.equal(documentRoot.listeners.has("load"), false);
assert.deepEqual([shadowFrame.style.value, shadowFrame.style.priority], ["shadow", ""]);
assert.deepEqual([added.style.value, added.style.priority], ["page-change", ""]);

console.log("13 preload annotation frame pointer guard assertions passed");
