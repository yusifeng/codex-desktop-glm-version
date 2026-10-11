import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isPathAtOrBelowAnyRoot, isPathBelowAnyRoot } = require("../app/.vite/build/worker/parcel-watcher-paths.js");
const pathApi = { dirname(value) { const index = value.lastIndexOf("/"); return index <= 0 ? "/" : value.slice(0, index); } };

assert.equal(isPathAtOrBelowAnyRoot(pathApi, "/repo", new Set(["/repo"])), true);
assert.equal(isPathAtOrBelowAnyRoot(pathApi, "/repo/a/b", new Set(["/repo/a"])), true);
assert.equal(isPathAtOrBelowAnyRoot(pathApi, "/repo/a", new Set(["/repo/a/b"])), false);
assert.equal(isPathAtOrBelowAnyRoot(pathApi, "/other", new Set(["/repo"])), false);
assert.equal(isPathAtOrBelowAnyRoot(pathApi, "/repo/a", new Set(["/repo/a", "/repo"])), true);
assert.equal(isPathBelowAnyRoot(pathApi, "/repo/a", new Set(["/repo/a"])), false);
assert.equal(isPathBelowAnyRoot(pathApi, "/repo/a/b", new Set(["/repo/a"])), true);

console.log("7 worker parcel watcher path assertions passed");
