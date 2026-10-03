import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { completeTurnDiffCapture, startTurnDiffCapture } = require("../app/.vite/build/worker/git-turn-diff-request-handlers.js");

const signal = new AbortController().signal;
const gitManager = { id: "manager" };
const host = { id: "local" };
const watchedRoots = [];
const calls = [];
const deps = {
  gitManager,
  host,
  signal,
  isRepoWatched: (root) => {
    watchedRoots.push(root);
    return root === "/watched";
  },
  startCapture: async (args) => {
    calls.push(["start", args]);
    return { capture: "started" };
  },
  completeCapture: async (args) => {
    calls.push(["complete", args]);
    return { diff: "complete" };
  },
};

const startParams = { baseTurnId: "base", checkpointKey: "checkpoint", cwd: "/repo", turnId: "turn", ignored: true };
assert.deepEqual(await startTurnDiffCapture(startParams, deps), { capture: "started" });
assert.deepEqual(calls[0][1], {
  host,
  baseTurnId: "base",
  checkpointKey: "checkpoint",
  cwd: "/repo",
  gitManager,
  isRepoWatched: deps.isRepoWatched,
  signal,
  turnId: "turn",
});
assert.equal(calls[0][1].isRepoWatched("/watched"), true);
assert.equal(calls[0][1].isRepoWatched("/other"), false);
assert.deepEqual(watchedRoots, ["/watched", "/other"]);

const capture = { root: "/repo" };
assert.deepEqual(await completeTurnDiffCapture({ capture, retainCheckpoint: true, ignored: true }, deps), { diff: "complete" });
assert.deepEqual(calls[1][1], { host, capture, gitManager, retainCheckpoint: true, signal });
assert.equal("ignored" in calls[1][1], false);

console.log("8 worker git turn diff request handler assertions passed");
