import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { commitGitChanges } = require("../app/.vite/build/worker/git-commit-request-handler.js");

function fixture({ repository = { root: "/root" }, responses = [], stageResult = { success: true } } = {}) {
  const events = [];
  const signal = new AbortController().signal;
  const host = { id: "local", isLocal: true };
  const deps = {
    gitManager: { getWorktreeRepository: async (...args) => { events.push(["repository", ...args]); return repository; } },
    host,
    signal,
    environment: { PATH: "/bin" },
    invalidateUntrackedPathsCache: (repo) => events.push(["invalidate", repo]),
    getUntrackedPaths: (repo) => { events.push(["untracked", repo]); return Promise.resolve(["new.ts"]); },
    stageWorktree: async (args) => { events.push(["stage", args]); return stageResult; },
    runGit: async (...args) => { events.push(["git", ...args]); return responses.shift() ?? { success: true, stdout: "", stderr: "", command: "git" }; },
    formatCommitMessage: (message, attribution) => `${message}|${attribution}`,
    formatCommitAttribution: (value) => `by:${value}`,
    formatExecOutput: (args) => ({ formatted: args }),
  };
  return { deps, events, host, repository, signal };
}

{
  const { deps, events, host, repository, signal } = fixture({ responses: [{ success: true }, { success: true, stdout: "abc" }] });
  const output = await commitGitChanges({ cwd: "/cwd", message: "msg", commitAttribution: "me", includeUnstaged: true }, deps);
  assert.deepEqual(output, { result: { status: "success", commitSha: "abc" }, refreshRoot: "/cwd" });
  assert.deepEqual(events[0], ["repository", "/cwd", host]);
  assert.deepEqual(events[1], ["invalidate", repository]);
  assert.equal(events[2][0], "untracked");
  assert.deepEqual(events[3][1], { gitRoot: "/root", env: deps.environment, signal, host, untrackedPathsPromise: events[3][1].untrackedPathsPromise });
  assert.deepEqual(events[4], ["git", "/root", ["commit", "-m", "msg|by:me"], host, { signal }]);
  assert.deepEqual(events[5], ["git", "/root", ["rev-parse", "HEAD"], host, { signal }]);
}

{
  const stageResult = { success: false, command: "git add", stdout: "", stderr: "stage failed" };
  const { deps, events } = fixture({ stageResult });
  const output = await commitGitChanges({ cwd: "/cwd", message: "msg", includeUnstaged: true }, deps);
  assert.equal(output.result.error, "stage failed");
  assert.equal(output.refreshRoot, null);
  assert.equal(events.some((event) => event[0] === "git"), false);
}

{
  const { deps, events, host, signal } = fixture({ repository: null, responses: [{ success: true }, { success: true }, { success: false }] });
  const output = await commitGitChanges({ cwd: 42, message: "msg", includeUnstaged: true }, deps);
  assert.deepEqual(events[1], ["git", "42", ["add", "-A"], host, { signal }]);
  assert.equal(output.result.commitSha, null);
  assert.equal(output.refreshRoot, 42);
}

{
  const commitFailure = { success: false, command: "git commit", stdout: "", stderr: "commit failed" };
  const { deps } = fixture({ responses: [commitFailure, { success: true }] });
  const output = await commitGitChanges({ cwd: "/cwd", message: "msg", includeUnstaged: false }, deps);
  assert.equal(output.result.errorType, "nothing-to-commit");
  assert.equal(output.refreshRoot, null);
}

{
  const commitFailure = { success: false, command: "git commit", stdout: "", stderr: "commit failed" };
  const { deps } = fixture({ responses: [commitFailure, { success: false }] });
  const output = await commitGitChanges({ cwd: "/cwd", message: "msg", includeUnstaged: true }, deps);
  assert.equal(output.result.errorType, undefined);
  assert.equal(output.refreshRoot, "/cwd");
  assert.equal(output.result.execOutput.formatted.fallbackOutput, "commit failed");
}

console.log("18 worker git commit request handler assertions passed");
