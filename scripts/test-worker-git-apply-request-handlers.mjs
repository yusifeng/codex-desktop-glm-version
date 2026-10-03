import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { applyGitChanges, applyGitPatch, applyGitReviewSectionChanges } = require("../app/.vite/build/worker/git-apply-request-handlers.js");

const signal = new AbortController().signal;
const calls = [];
let nextResult;
const deps = {
  gitManager: { id: "git" },
  host: { id: "host" },
  signal,
  applyChanges: async (params) => { calls.push(["changes", params]); return nextResult; },
  applyPatch: async (...args) => { calls.push(["patch", ...args]); return nextResult; },
  applyReviewSectionChanges: async (params) => { calls.push(["review", params]); return nextResult; },
};

nextResult = { status: "success" };
assert.deepEqual(await applyGitChanges({ destinationRoot: "/destination", value: 1 }, deps), {
  result: nextResult,
  refreshRoot: "/destination",
});
assert.deepEqual(calls.at(-1), ["changes", {
  destinationRoot: "/destination",
  value: 1,
  gitManager: deps.gitManager,
  host: deps.host,
  signal,
}]);
nextResult = { status: "command-error" };
assert.equal((await applyGitChanges({ destinationRoot: "/destination" }, deps)).refreshRoot, null);

nextResult = { status: "error", appliedPaths: [] };
assert.equal((await applyGitPatch({ cwd: "/repo" }, deps)).refreshRoot, null);
assert.deepEqual(calls.at(-1), ["patch", { cwd: "/repo" }, deps.gitManager, deps.host, { signal }]);
nextResult = { status: "error", appliedPaths: ["partial"] };
assert.equal((await applyGitPatch({ cwd: "/repo" }, deps)).refreshRoot, "/repo");
nextResult = { status: "success", appliedPaths: [] };
assert.equal((await applyGitPatch({ cwd: "/repo" }, deps)).refreshRoot, "/repo");

nextResult = { status: "error", appliedPaths: [] };
assert.equal((await applyGitReviewSectionChanges({ cwd: "/review", section: 2 }, deps)).refreshRoot, null);
assert.deepEqual(calls.at(-1), ["review", {
  cwd: "/review",
  section: 2,
  gitManager: deps.gitManager,
  host: deps.host,
  signal,
}]);
nextResult = { status: "error", appliedPaths: ["partial"] };
assert.equal((await applyGitReviewSectionChanges({ cwd: "/review" }, deps)).refreshRoot, "/review");
nextResult = { status: "success", appliedPaths: [] };
assert.equal((await applyGitReviewSectionChanges({ cwd: "/review" }, deps)).refreshRoot, "/review");

console.log("11 worker git apply request handler assertions passed");
