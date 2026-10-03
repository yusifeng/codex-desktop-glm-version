import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { checkoutGitBranch, classifyCheckoutFailure, parseCheckoutConflictPaths, resolveCheckoutArgs } = require("../app/.vite/build/worker/git-checkout-request-handler.js");

assert.deepEqual(parseCheckoutConflictPaths("error: Your local changes would be overwritten by checkout:\n a.ts\n b.ts\nPlease commit"), { conflictedPaths: ["a.ts", "b.ts"], hasConflictHeader: true });
assert.deepEqual(classifyCheckoutFailure("", "ordinary failure"), { errorType: "unknown", conflictedPaths: [] });

const signal = new AbortController().signal;
const events = [];
const responses = [];
const deps = {
  gitManager: { invalidateGitReadCachesForRepoChange: (...args) => events.push(["invalidate", ...args]) },
  host: { id: "local" },
  signal,
  normalizeRoot: (cwd) => `normalized:${cwd}`,
  runGit: async (_cwd, args) => {
    events.push(["git", args]);
    return responses.shift() ?? { success: true, stdout: "", stderr: "", command: `git ${args.join(" ")}` };
  },
  formatExecOutput: (args) => ({ formatted: args }),
};

assert.equal((await checkoutGitBranch({ cwd: " ", branch: "main" }, deps)).result.error, "No workspace available for branch checkout");
assert.equal((await checkoutGitBranch({ cwd: "/repo", branch: " " }, deps)).result.error, "Branch name is required");

responses.push({ success: true, stdout: "", stderr: "" }, { success: true, stdout: "", stderr: "" });
assert.deepEqual(await resolveCheckoutArgs("/repo", "main", deps), { status: "success", args: ["checkout", "main"] });

responses.push({ success: true, stdout: "", stderr: "" }, { success: false, stdout: "", stderr: "" }, { success: true, stdout: "refs/remotes/origin/topic\n", stderr: "" });
assert.deepEqual(await resolveCheckoutArgs("/repo", "topic", deps), { status: "success", args: ["checkout", "--track", "-b", "topic", "refs/remotes/origin/topic"] });

const sha = "a".repeat(40);
responses.push({ success: false, stdout: "", stderr: "" }, { success: true, stdout: sha, stderr: "" });
assert.deepEqual(await resolveCheckoutArgs("/repo", "HEAD~1", deps), { status: "success", args: ["checkout", "--detach", sha] });

events.length = 0;
responses.push({ success: true, stdout: "", stderr: "" }, { success: true, stdout: "", stderr: "" }, { success: true, stdout: "", stderr: "" });
const success = await checkoutGitBranch({ cwd: "/repo", branch: " main " }, deps);
assert.deepEqual(success, { result: { status: "success", branch: "main", stashRef: null }, refreshRoot: "normalized:/repo" });
assert.deepEqual(events.slice(-2), [["invalidate", "head", deps.host], ["invalidate", "working-tree", deps.host]]);

events.length = 0;
responses.push(
  { success: true, stdout: "", stderr: "" },
  { success: true, stdout: "", stderr: "" },
  { success: true, stdout: "saved", stderr: "" },
  { success: true, stdout: "stash-sha", stderr: "" },
  { success: false, stdout: "", stderr: "error: changes would be overwritten by checkout:\n file.ts\nAborting", command: "git checkout" },
  { success: true, stdout: "", stderr: "" },
);
const statuses = [];
const failed = await checkoutGitBranch({ cwd: "/repo", branch: "main", stashUncommitted: true }, deps, { onCheckoutStatusChange: (value) => statuses.push(["checkout", value]), onStashStatusChange: (value) => statuses.push(["stash", value]) });
assert.equal(failed.result.errorType, "blocked-by-working-tree-changes");
assert.deepEqual(failed.result.conflictedPaths, ["file.ts"]);
assert.equal(failed.refreshRoot, null);
assert.deepEqual(statuses, [["stash", "started"], ["stash", "completed"], ["checkout", "started"], ["checkout", "failed"]]);
assert.equal(events.some(([, args]) => Array.isArray(args) && args[0] === "stash" && args[1] === "pop"), true);

events.length = 0;
responses.push(
  { success: true, stdout: "", stderr: "" },
  { success: true, stdout: "", stderr: "" },
  { success: false, stdout: "", stderr: "stash failed", command: "git stash" },
);
const stashFailure = await checkoutGitBranch({ cwd: "/repo", branch: "main", stashUncommitted: true }, deps);
assert.equal(stashFailure.result.errorType, "failed-to-stash-changes");
assert.equal(events.some(([, args]) => Array.isArray(args) && args[0] === "checkout"), false);

console.log("16 worker git checkout request handler assertions passed");
