import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { setGitConfigValue } = require("../app/.vite/build/worker/git-config-request-handler.js");

const signal = new AbortController().signal;
const calls = [];
let success = true;
const repository = {
  setConfigValueForScope: async (...args) => {
    calls.push(args);
    return success;
  },
};
const deps = {
  gitManager: { getWorktreeRepositoryForRoot: (...args) => { calls.push(args); return repository; } },
  host: { id: "local" },
  signal,
};

assert.deepEqual(await setGitConfigValue({ root: "/repo", key: "user.name", value: "Codex", scope: "local" }, deps), { result: { success: true }, refreshRoot: "/repo" });
assert.deepEqual(calls, [["/repo", deps.host], ["user.name", "Codex", "local", signal]]);
assert.deepEqual(await setGitConfigValue({ root: "/repo", key: "codex.localEnvironmentConfigPath", value: "env.toml", scope: "worktree" }, deps), { result: { success: true }, refreshRoot: null });
assert.deepEqual(await setGitConfigValue({ root: "/repo", key: "user.name", value: "Codex", scope: "worktree" }, deps), { result: { success: true }, refreshRoot: "/repo" });
success = false;
assert.deepEqual(await setGitConfigValue({ root: "/repo", key: "user.name", value: "Codex", scope: "local" }, deps), { result: { success: false }, refreshRoot: null });

console.log("5 worker git config request handler assertions passed");
