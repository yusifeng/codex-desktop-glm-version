import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { initializeGitRepository } = require("../app/.vite/build/worker/git-init-request-handler.js");

const calls = [];
const deps = {
  gitManager: { invalidateStableMetadata: () => calls.push(["invalidate"]) },
  host: { id: "local" },
  runGit: async (...args) => {
    calls.push(["git", ...args]);
    return { success: true, stdout: "initialized" };
  },
};

assert.deepEqual(await initializeGitRepository({ cwd: "  /repo  " }, deps), { success: true });
assert.deepEqual(calls, [["git", "/repo", ["init"], deps.host], ["invalidate"]]);
await assert.rejects(initializeGitRepository({ cwd: "   " }, deps), /Workspace root is required/);
assert.equal(calls.length, 2);

for (const [result, message] of [
  [{ success: false, stderr: "stderr", stdout: "stdout" }, "stderr"],
  [{ success: false, stderr: "", stdout: "stdout" }, "stdout"],
  [{ success: false, stderr: "", stdout: "" }, "Failed to run git init"],
]) {
  const failedCalls = [];
  await assert.rejects(initializeGitRepository({ cwd: "/repo" }, {
    ...deps,
    gitManager: { invalidateStableMetadata: () => failedCalls.push("invalidate") },
    runGit: async () => result,
  }), new RegExp(message));
  assert.deepEqual(failedCalls, []);
}

const thrown = new Error("spawn failed");
await assert.rejects(initializeGitRepository({ cwd: "/repo" }, { ...deps, runGit: async () => { throw thrown; } }), (error) => error === thrown);

console.log("11 worker git init request handler assertions passed");
