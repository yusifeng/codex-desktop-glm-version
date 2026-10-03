import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { classifyGitPushFailure, pushGitRepository } = require("../app/.vite/build/worker/git-push-request-handler.js");

assert.equal(classifyGitPushFailure("! refs [rejected] (non-fast-forward)\n", ""), "remote-updated");
assert.equal(classifyGitPushFailure("error: pre-receive hook declined\n", ""), "remote-rejected");
assert.equal(classifyGitPushFailure("", "fatal: The current branch has no upstream branch"), "no-upstream");
assert.equal(classifyGitPushFailure("", "Authentication failed"), "auth");
assert.equal(classifyGitPushFailure("ignored output", "other"), "unknown");

const repository = { id: "repo" };
const signal = new AbortController().signal;
const calls = [];
const deps = {
  gitManager: { getWorktreeRepository: async (...args) => { calls.push(["repository", ...args]); return repository; } },
  host: { id: "local" },
  signal,
  normalizeRoot: (cwd) => `normalized:${cwd.trim()}`,
  getDefaultRemoteBranch: async () => ({ remote: "origin" }),
  getRemotes: async () => ["fallback"],
  runGit: async (...args) => { calls.push(["git", ...args]); return { success: true }; },
  formatCommand: (args) => args.join(" "),
  formatExecOutput: (args) => ({ formatted: args }),
};

const empty = await pushGitRepository({ cwd: " ", force: true, setUpstream: true }, deps);
assert.deepEqual(empty, { result: { status: "error", error: "unknown", execOutput: { command: "git push --porcelain --force-with-lease -u", output: "No workspace available for push" } }, refreshRoot: null });
assert.equal(calls.length, 0);

const success = await pushGitRepository({ cwd: " /repo ", force: true, setUpstream: true, refspec: " feature " }, deps);
assert.deepEqual(success, { result: { status: "success", remote: "origin", refspec: "feature" }, refreshRoot: "normalized:/repo" });
assert.deepEqual(calls[0], ["repository", "normalized:/repo", deps.host]);
assert.deepEqual(calls[1], ["git", "/repo", ["push", "--porcelain", "--force-with-lease", "-u", "origin", "feature"], deps.host, { signal }]);

const fallbackRemote = await pushGitRepository({ cwd: "/repo" }, { ...deps, getDefaultRemoteBranch: async () => null });
assert.equal(fallbackRemote.result.remote, "fallback");
assert.equal(fallbackRemote.result.refspec, null);

const noRemote = await pushGitRepository({ cwd: "/repo" }, { ...deps, getDefaultRemoteBranch: async () => null, getRemotes: async () => [] });
assert.equal(noRemote.result.execOutput.output, "No git remote configured for push");
assert.equal(noRemote.refreshRoot, null);

const failure = await pushGitRepository({ cwd: "/repo" }, {
  ...deps,
  runGit: async () => ({ success: false, command: "git push", stdout: "! refs [rejected] (stale info)\n", stderr: "" }),
});
assert.equal(failure.result.error, "remote-updated");
assert.deepEqual(failure.result.execOutput.formatted, { command: "git push", stdout: "! refs [rejected] (stale info)\n", stderr: "", fallbackOutput: "! refs [rejected] (stale info)\n" });
assert.equal(failure.refreshRoot, null);

console.log("17 worker git push request handler assertions passed");
