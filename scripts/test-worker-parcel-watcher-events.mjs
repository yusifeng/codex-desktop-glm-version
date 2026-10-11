import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { projectParcelWatcherEvents } = require("../app/.vite/build/worker/parcel-watcher-events.js");
const pathApi = { dirname(value) { const index = value.lastIndexOf("/"); return index <= 0 ? "/" : value.slice(0, index); } };

assert.deepEqual(projectParcelWatcherEvents(pathApi, "/repo", [
  { path: "/repo/a", type: "update" },
  { path: "/repo/old", type: "delete" },
], "changed-path-with-parent-directory"), {
  pathChanges: [{ path: "/repo/a", type: "update" }, { path: "/repo/old", type: "delete" }],
  changedPaths: ["/repo/a", "/repo/old", "/repo"],
  rootDeleted: false,
  pathsToCheck: ["/repo/a", "/repo/old"],
});
assert.deepEqual(projectParcelWatcherEvents(pathApi, "/repo", [{ path: "/repo", type: "delete" }], "none").rootDeleted, true);
assert.deepEqual(projectParcelWatcherEvents(pathApi, "/repo", [{ path: "/repo", type: "update" }], "none").pathsToCheck, []);
assert.deepEqual(projectParcelWatcherEvents(pathApi, "/repo", [], "none"), { pathChanges: [], changedPaths: [], rootDeleted: false, pathsToCheck: [] });

console.log("6 worker parcel watcher event assertions passed");
