import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { dispatchAnnotationSurfaceRequest, isAnnotationSurfaceResponseEvent } = require("../app/.vite/build/browser-page-preload/annotation-surface-events.js");

class FakeCustomEvent {
  constructor(type, init) { this.type = type; Object.assign(this, init); }
}
const events = [];
const target = { dispatchEvent(event) { events.push(event); return "sent"; } };
assert.equal(dispatchAnnotationSurfaceRequest(target, "request", { type: "probe", count: 2 }, FakeCustomEvent), "sent");
assert.equal(events[0].type, "request");
assert.equal(events[0].bubbles, true);
assert.deepEqual(JSON.parse(events[0].detail), { type: "probe", count: 2 });
assert.equal(isAnnotationSurfaceResponseEvent(events[0], FakeCustomEvent), true);
assert.equal(isAnnotationSurfaceResponseEvent({ type: "request" }, FakeCustomEvent), false);
console.log("5 preload annotation surface event assertions passed");
