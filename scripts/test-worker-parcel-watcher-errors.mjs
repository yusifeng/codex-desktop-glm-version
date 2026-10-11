import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isParcelWatcherMissingPathError } = require("../app/.vite/build/worker/parcel-watcher-errors.js");

assert.equal(isParcelWatcherMissingPathError({ code: "ENOENT" }, "ENOENT"), true);
assert.equal(isParcelWatcherMissingPathError({ code: "ENOTDIR" }, "ENOENT"), false);
assert.equal(isParcelWatcherMissingPathError({ code: "EACCES" }, "EACCES"), true);
assert.equal(isParcelWatcherMissingPathError(null, "ENOENT"), false);
assert.equal(isParcelWatcherMissingPathError({ code: 404 }, "404"), false);

console.log("5 worker parcel watcher error assertions passed");
