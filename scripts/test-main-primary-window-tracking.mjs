import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { installPrimaryWindowTracking } = require("../app/.vite/build/main-app/window/primary-window-tracking.js");

const events = [];
const listeners = new Map();
let focused = true;
let hasLast = false;
installPrimaryWindowTracking({
  isFocused: () => focused, now: () => 42,
  addPrimaryWindow: () => events.push("add"),
  setLastActiveWindow: () => { hasLast = true; events.push("active"); },
  setLastActiveAt: (value) => events.push(`at:${value}`),
  hasLastActiveWindow: () => hasLast,
  emitChange: () => events.push("emit"),
  on: (event, listener) => listeners.set(event, listener),
});
assert.deepEqual(events, ["add", "active", "at:42", "emit"]);
listeners.get("focus")();
listeners.get("blur")();
assert.deepEqual(events.slice(-4), ["active", "at:42", "emit", "at:42"]);

const unfocused = [];
installPrimaryWindowTracking({
  isFocused: () => false, now: () => 7, addPrimaryWindow: () => unfocused.push("add"),
  setLastActiveWindow: () => unfocused.push("active"), setLastActiveAt: (value) => unfocused.push(value),
  hasLastActiveWindow: () => true, emitChange: () => unfocused.push("emit"), on: () => {},
});
assert.deepEqual(unfocused, ["add", "emit"]);
console.log("7 main primary-window tracking assertions passed");
