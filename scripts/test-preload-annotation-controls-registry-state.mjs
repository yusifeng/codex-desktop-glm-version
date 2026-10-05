import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationControlsRegistryState } = require("../app/.vite/build/browser-page-preload/annotation-controls-registry-state.js");

const attached = [];
const detached = [];
const state = createAnnotationControlsRegistryState({
  maxControls: 2,
  maxTotalTargets: 2,
  attachTargets(record, targets, index) {
    record.targets = [...targets].map((target) => new WeakRef(target));
    for (const target of targets) index.set(target, [record]);
    attached.push(record.id);
    return targets.size;
  },
  detachTargets(record, index) {
    for (const reference of record.targets) {
      const target = reference.deref();
      if (target != null) index.delete(target);
    }
    detached.push(record.id);
    return record.targets.length;
  },
});

const firstTarget = {};
const secondTarget = {};
assert.equal(state.disposed, false);
assert.equal(state.register("first", { label: "one" }, new Set([firstTarget])), true);
assert.equal(state.register("first", {}, new Set([secondTarget])), false);
assert.equal(state.register("empty", {}, new Set()), false);
assert.equal(state.register("too-many", {}, new Set([firstTarget, secondTarget])), false);
assert.equal(state.update("first", { label: "updated" }, new Set([firstTarget, secondTarget])), true);
assert.deepEqual(state.get("first").controls, { label: "updated" });
assert.deepEqual(attached, ["first", "first"]);
assert.deepEqual(detached, ["first"]);
assert.equal(state.register("second", {}, new Set([secondTarget])), false);
assert.equal(state.remove("first"), true);
assert.equal(state.remove("first"), false);
assert.equal(state.register("second", {}, new Set([secondTarget])), true);
assert.equal(state.dispose(), true);
assert.equal(state.disposed, true);
assert.equal(state.get("second"), undefined);
assert.deepEqual([...state.values()], []);
assert.equal(state.register("late", {}, new Set([firstTarget])), false);
assert.equal(state.update("second", {}, undefined), false);
assert.equal(state.remove("second"), false);
assert.equal(state.dispose(), false);

console.log("20 preload annotation controls registry state assertions passed");
