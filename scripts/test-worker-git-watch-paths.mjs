import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  combineOptionalBooleans,
  isMissingPathError,
  isWithinPath,
  isWatchedRefPath,
  isWorktreeTopologyPath,
} = require("../app/.vite/build/worker/git-watch-paths.js");

const pathApi = {
  sep: "/",
  relative(from, to) {
    if (to === from) return "";
    if (to.startsWith(`${from}/`)) return to.slice(from.length + 1);
    return to === "/other" ? "../other" : to;
  },
  isAbsolute(value) {
    return value.startsWith("/");
  },
};

assert.equal(isWithinPath(pathApi, "/repo", "/repo"), true);
assert.equal(isWithinPath(pathApi, "/repo", "/repo/src/file"), true);
assert.equal(isWithinPath(pathApi, "/repo", "/other"), false);
assert.equal(isWatchedRefPath(pathApi, "/repo/refs", "/repo/refs/heads/main"), true);
assert.equal(isWatchedRefPath(pathApi, "/repo/refs", "/repo/refs/heads/main.lock"), false);
const markers = new Set(["HEAD", "commondir", "gitdir", "locked"]);
assert.equal(isWorktreeTopologyPath(pathApi, "/repo/worktrees", "/repo/worktrees/a", markers), true);
assert.equal(isWorktreeTopologyPath(pathApi, "/repo/worktrees", "/repo/worktrees/a/HEAD", markers), true);
assert.equal(isWorktreeTopologyPath(pathApi, "/repo/worktrees", "/repo/worktrees/a/other", markers), false);
assert.equal(combineOptionalBooleans([false, undefined]), null);
assert.equal(combineOptionalBooleans([false, null]), null);
assert.equal(combineOptionalBooleans([false, false]), false);
assert.equal(combineOptionalBooleans([null, true]), true);
assert.equal(isMissingPathError({ code: "ENOENT" }), true);
assert.equal(isMissingPathError({ code: "ENOTDIR" }), true);
assert.equal(isMissingPathError({ code: "EACCES" }), false);
assert.equal(isMissingPathError(null), false);

console.log("15 worker git watch path assertions passed");
