import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { runWorktreeSetup } = require("../app/.vite/build/worker/git-worktree-setup.js");
let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const signal = new AbortController().signal;
function fixture(overrides = {}) {
  const calls = [];
  const deps = {
    originalWorkspaceEnv: "ORIGINAL",
    worktreeWorkspaceEnv: "WORKTREE",
    readLocalEnvironmentConfig: async (...args) => { calls.push(["read", ...args]); return { configPath: "/env.toml", environment: {} }; },
    runSetupScript: async (...args) => { calls.push(["setup", ...args]); return { setupResult: { status: "succeeded" }, shellEnvironment: { PATH: "/bin" } }; },
    removeWorktreeShellEnvironment: async (...args) => calls.push(["remove-shell", ...args]),
    writeWorktreeShellEnvironment: async (...args) => calls.push(["write-shell", ...args]),
    ...overrides,
  };
  return { calls, deps };
}
let state = fixture();
let result = await runWorktreeSetup(null, { host: "host", signal, workspaceRoot: "/source", worktreeGitRoot: "/wt", worktreeWorkspaceRoot: "/wt/ws", worktreeRepository: "repo" }, state.deps);
equal(result.success, true); equal(state.calls.length, 0);
state = fixture({ readLocalEnvironmentConfig: async () => ({ type: "error", error: { message: "bad" } }) });
result = await runWorktreeSetup("/env", { host: "host", signal, workspaceRoot: "/source", worktreeGitRoot: "/wt", worktreeWorkspaceRoot: "/wt/ws", worktreeRepository: "repo" }, state.deps);
equal(result.success, false); equal(result.error.message, "bad");
state = fixture({ runSetupScript: async (...args) => { state.calls.push(["setup", ...args]); return { setupResult: { status: "failed", error: "nope" } }; } });
result = await runWorktreeSetup("/env", { allowSetupFailure: true, host: "host", signal, workspaceRoot: "/source", worktreeGitRoot: "/wt", worktreeWorkspaceRoot: "/wt/ws", worktreeRepository: "repo" }, state.deps);
equal(result.success, true); equal(result.setupResult.status, "failed");
state = fixture();
result = await runWorktreeSetup("/env", { host: "host", signal, workspaceRoot: "/source", worktreeGitRoot: "/wt", worktreeWorkspaceRoot: "/wt/ws", worktreeRepository: "repo" }, state.deps);
equal(result.setupResult.status, "succeeded"); equal(state.calls.at(-1)[0], "write-shell");
deepEqual(state.calls.find((entry) => entry[0] === "setup")[5], { ORIGINAL: "/source", WORKTREE: "/wt/ws" });
console.log(`test-worker-git-worktree-setup: ${assertions} assertions passed`);
