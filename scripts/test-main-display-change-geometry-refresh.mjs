import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { installDisplayChangeGeometryRefresh } = require("../app/.vite/build/main-app/startup/display-change-geometry-refresh.js");

const listeners = new Map();
const screen = {
  on: (event, listener) => listeners.set(event, listener),
  off: (event, listener) => { assert.equal(listeners.get(event), listener); listeners.delete(event); },
};
let refreshes = 0;
const cleanup = installDisplayChangeGeometryRefresh({ platform: "darwin", screen, refresh: () => { refreshes += 1; } });
assert.deepEqual([...listeners.keys()].sort(), ["display-added", "display-metrics-changed", "display-removed"]);
for (const listener of listeners.values()) listener();
assert.equal(refreshes, 3);
cleanup();
assert.equal(listeners.size, 0);
assert.equal(installDisplayChangeGeometryRefresh({ platform: "linux", screen, refresh: () => { throw new Error("must not subscribe"); } }), undefined);
console.log("5 main display-change geometry refresh assertions passed");
