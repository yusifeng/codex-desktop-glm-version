import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  findImageInEventPath,
  getMouseNavigationDirection,
  installBrowserInputBridge,
} = require("../app/.vite/build/browser-page-preload/browser-input-bridge.js");

class ImageElement {
  constructor({ currentSrc = "", src = "" } = {}) {
    this.currentSrc = currentSrc;
    this.src = src;
  }
}

assert.equal(getMouseNavigationDirection({ button: 3 }), "back");
assert.equal(getMouseNavigationDirection({ button: 4 }), "forward");
assert.equal(getMouseNavigationDirection({ button: 0 }), null);

const pathImage = new ImageElement({ src: "path.png" });
const targetImage = new ImageElement({ src: "target.png" });
assert.equal(findImageInEventPath({ composedPath: () => [{}, pathImage], target: targetImage }, ImageElement), pathImage);
assert.equal(findImageInEventPath({ composedPath: () => [{}], target: targetImage }, ImageElement), targetImage);
assert.equal(findImageInEventPath({ composedPath: () => [{}], target: {} }, ImageElement), null);

const listeners = new Map();
const registrations = [];
const messages = [];
installBrowserInputBridge({
  windowLike: {
    addEventListener(type, listener, capture) {
      registrations.push([type, capture]);
      listeners.set(type, listener);
    },
  },
  imageElementConstructor: ImageElement,
  invokeHost: (message) => messages.push(message),
});
assert.deepEqual(registrations, [
  ["mousedown", true],
  ["mouseup", true],
  ["auxclick", true],
  ["dragstart", true],
  ["dragend", true],
]);

function mouseEvent(button, isTrusted = true) {
  const calls = [];
  return {
    button,
    isTrusted,
    calls,
    preventDefault: () => calls.push("preventDefault"),
    stopPropagation: () => calls.push("stopPropagation"),
  };
}

const untrustedDown = mouseEvent(3, false);
listeners.get("mousedown")(untrustedDown);
assert.deepEqual(untrustedDown.calls, ["preventDefault", "stopPropagation"]);
const forwardAuxClick = mouseEvent(4, false);
listeners.get("auxclick")(forwardAuxClick);
assert.deepEqual(forwardAuxClick.calls, ["preventDefault", "stopPropagation"]);
const primaryDown = mouseEvent(0);
listeners.get("mousedown")(primaryDown);
assert.deepEqual(primaryDown.calls, []);

const backUp = mouseEvent(3);
listeners.get("mouseup")(backUp);
assert.deepEqual(backUp.calls, ["preventDefault", "stopPropagation"]);
assert.deepEqual(messages.at(-1), { type: "browser-sidebar-runtime-mouse-navigation", direction: "back" });
const messageCount = messages.length;
const untrustedUp = mouseEvent(4, false);
listeners.get("mouseup")(untrustedUp);
assert.deepEqual(untrustedUp.calls, []);
assert.equal(messages.length, messageCount);
const primaryUp = mouseEvent(0);
listeners.get("mouseup")(primaryUp);
assert.deepEqual([primaryUp.calls, messages.length], [[], messageCount]);

const dragEvent = (overrides = {}) => ({
  isTrusted: true,
  composedPath: () => [],
  target: null,
  ...overrides,
});
listeners.get("dragstart")(dragEvent({ target: new ImageElement({ currentSrc: "current.png", src: "fallback.png" }) }));
assert.deepEqual(messages.at(-1), { type: "browser-sidebar-runtime-image-drag-started", sourceUrl: "current.png" });
listeners.get("dragend")(dragEvent());
assert.deepEqual(messages.at(-1), { type: "browser-sidebar-runtime-image-drag-ended" });
const endedCount = messages.length;
listeners.get("dragend")(dragEvent());
assert.equal(messages.length, endedCount);

listeners.get("dragstart")(dragEvent({ isTrusted: false, target: new ImageElement({ src: "ignored.png" }) }));
assert.equal(messages.length, endedCount);
listeners.get("dragstart")(dragEvent({ target: new ImageElement() }));
assert.equal(messages.length, endedCount);
listeners.get("dragstart")(dragEvent({ target: new ImageElement({ src: "active.png" }) }));
listeners.get("dragend")(dragEvent({ isTrusted: false }));
assert.deepEqual(messages.at(-1), { type: "browser-sidebar-runtime-image-drag-started", sourceUrl: "active.png" });
listeners.get("dragend")(dragEvent());
assert.deepEqual(messages.at(-1), { type: "browser-sidebar-runtime-image-drag-ended" });

console.log("22 browser input bridge assertions passed");
