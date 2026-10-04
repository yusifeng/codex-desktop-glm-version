import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { dispatchTurnDiffRequest } = require(
  "../app/.vite/build/worker/git-turn-diff-request-dispatch.js",
);

const signal = new AbortController().signal;
const host = { id: "local" };
const gitManager = { id: "manager" };
const calls = [];
const deps = {
  host,
  gitManager,
  signal,
  isRepoWatched: (root) => root === "/watched",
  startCapture: async (args) => (calls.push(["start", args]), { capture: "started" }),
  completeCapture: async (args) => (calls.push(["complete", args]), { diff: "complete" }),
};

assert.deepEqual(
  await dispatchTurnDiffRequest(
    "turn-diff-capture-start",
    { baseTurnId: "base", checkpointKey: "checkpoint", cwd: "/repo", turnId: "turn" },
    deps,
  ),
  { handled: true, result: { capture: "started" } },
);
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

const capture = { root: "/repo" };
assert.deepEqual(
  await dispatchTurnDiffRequest(
    "turn-diff-capture-complete",
    { capture, retainCheckpoint: true },
    deps,
  ),
  { handled: true, result: { diff: "complete" } },
);
assert.deepEqual(calls[1][1], { host, capture, gitManager, retainCheckpoint: true, signal });
assert.deepEqual(
  await dispatchTurnDiffRequest("unknown", {}, deps),
  { handled: false, result: undefined },
);
console.log("test-worker-git-turn-diff-request-dispatch: 4 assertions passed");
