import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationControlsRegistry } = require("../app/.vite/build/browser-page-preload/annotation-controls-registry.js");

class FakeWindow {
  listeners = new Map();
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  emit(type, detail, trusted = true, persisted = false) {
    let prevented = false;
    this.listeners.get(type)?.({ detail, isTrusted: trusted, persisted, preventDefault() { prevented = true; } });
    return prevented;
  }
}

const fakeDocument = {};
const fakeWindow = new FakeWindow();
const records = new Map();
const index = new WeakMap();
const deps = {
  documentRef: fakeDocument,
  windowRef: fakeWindow,
  registerEvent: "register",
  updateEvent: "update",
  disposeEvent: "dispose",
  pagehideEvent: "pagehide",
  maxControls: 4,
  maxTotalTargets: 3,
  readDetail: (event) => event.detail,
  readField: (detail, key) => detail[key],
  parsePayload: (value, current) => {
    if (value == null) return current;
    return typeof value === "object" && value !== null ? value : undefined;
  },
  parseTargets: (value) => Array.isArray(value) ? new Set(value) : undefined,
  attachTargets: (record, targets, targetIndex, order) => {
    record.targets = [...targets].map((target) => new WeakRef(target));
    for (const target of targets) targetIndex.set(target, [...(targetIndex.get(target) ?? []), record]);
    records.set(record.id, record);
    return targets.size;
  },
  detachTargets: (record, targetIndex) => {
    let removed = record.targets.length;
    for (const reference of record.targets) {
      const target = reference.deref();
      if (target == null) continue;
      const linked = targetIndex.get(target) ?? [];
      const next = linked.filter((candidate) => candidate !== record);
      if (next.length === 0) targetIndex.delete(target); else targetIndex.set(target, next);
    }
    return removed;
  },
  collectTargets: (values, isValidTarget) => [...values].flatMap((record) => record.targets.map((reference) => reference.deref()).filter((target) => target && isValidTarget(target))),
  getControls: (target, documentRef, targetIndex) => target.ownerDocument === documentRef ? targetIndex.get(target)?.at(-1)?.controls : undefined,
  isValidTarget: (target) => target.ownerDocument === fakeDocument && target.isConnected,
  shouldDisposePagehide: (event) => event.isTrusted === true && event.persisted !== true,
};

const registry = createAnnotationControlsRegistry(deps);
const firstTarget = { ownerDocument: fakeDocument, isConnected: true };
const secondTarget = { ownerDocument: fakeDocument, isConnected: true };
assert.equal(fakeWindow.emit("register", { id: "first", payload: { label: "old" }, targets: [firstTarget] }), true);
assert.deepEqual(registry.getControls(firstTarget), { label: "old" });
assert.deepEqual(registry.getTargets(), [firstTarget]);
assert.equal(fakeWindow.emit("update", { id: "first", payload: { label: "new" }, targets: [secondTarget] }), true);
assert.equal(registry.getControls(firstTarget), undefined);
assert.deepEqual(registry.getControls(secondTarget), { label: "new" });
assert.equal(fakeWindow.emit("register", { id: "second", payload: { label: "two" }, targets: [firstTarget] }), true);
assert.deepEqual(registry.getControls(firstTarget), { label: "two" });
assert.equal(fakeWindow.emit("dispose", { id: "second" }), true);
assert.equal(registry.getControls(firstTarget), undefined);
assert.equal(fakeWindow.emit("register", { id: "too-many", payload: {}, targets: [firstTarget, secondTarget, {}] }), false);
assert.equal(fakeWindow.emit("pagehide", {}, false), false);
assert.deepEqual(registry.getTargets(), [secondTarget]);
assert.equal(fakeWindow.emit("pagehide", {}, true), false);
assert.deepEqual(registry.getTargets(), []);
assert.equal(fakeWindow.listeners.size, 0);

console.log("10 preload annotation controls registry assertions passed");
