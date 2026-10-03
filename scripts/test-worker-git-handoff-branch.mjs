import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  applyHandoffStash,
  ensureHandoffBranch,
  forceHandoffBranch,
  inspectHandoffBranch,
  resolveHandoffStashReference,
} = require("../app/.vite/build/worker/git-handoff-branch.js");

const calls = [];
const results = [];
const host = { id: "host" };
const deps = {
  runGit: async (...args) => {
    calls.push(args);
    return results.shift();
  },
  formatBranchRef: (branch) => branch.startsWith("refs/") ? branch : `refs/heads/${branch}`,
  formatExecOutput: (input) => ({ formatted: input }),
  isObjectId: (value) => /^[0-9a-f]{7,40}$/i.test(value),
};
const branchParams = { branch: "feature", cwd: "/repo", commitSha: "abc1234", host };

results.push({ success: false, code: 1 });
assert.deepEqual(await inspectHandoffBranch(branchParams, deps), { status: "missing" });
assert.deepEqual(calls.at(-1), ["/repo", ["show-ref", "--verify", "refs/heads/feature"], host]);

calls.length = 0;
results.push(
  { success: true, code: 0 },
  { success: true, stdout: "abc1234\n", stderr: "", command: "git rev-parse" },
);
assert.deepEqual(await inspectHandoffBranch(branchParams, deps), { status: "same-commit" });
assert.equal(calls.length, 2);

results.push(
  { success: true, code: 0 },
  { success: true, stdout: "different\n", stderr: "", command: "git rev-parse" },
);
const different = await inspectHandoffBranch(branchParams, deps);
assert.equal(different.status, "different-commit");
assert.equal(different.message, "Branch feature already exists at a different commit");
assert.deepEqual(different.execOutput.formatted, {
  command: "git rev-parse",
  stdout: "different\n",
  stderr: "",
  fallbackOutput: different.message,
});

calls.length = 0;
results.push(
  { success: true, code: 0 },
  { success: true, stdout: "abc1234", stderr: "", command: "git rev-parse" },
);
assert.equal(await ensureHandoffBranch(branchParams, deps), null);
assert.equal(calls.length, 2);

calls.length = 0;
results.push(
  { success: true, code: 0 },
  { success: true, stdout: "different", stderr: "", command: "git rev-parse" },
);
assert.equal((await ensureHandoffBranch(branchParams, deps)).message.includes("different commit"), true);
assert.equal(calls.length, 2);

calls.length = 0;
results.push(
  { success: false, code: 1 },
  { success: true, stdout: "", stderr: "", command: "git branch" },
);
assert.equal(await ensureHandoffBranch(branchParams, deps), null);
assert.deepEqual(calls.at(-1), ["/repo", ["branch", "feature", "abc1234"], host]);

results.push(
  { success: false, code: 1 },
  { success: false, stdout: "stdout error", stderr: "stderr error", command: "git branch" },
);
const createError = await ensureHandoffBranch(branchParams, deps);
assert.equal(createError.message, "stderr error");
assert.equal(createError.execOutput.formatted.fallbackOutput, "stderr error");

results.push({ success: true, command: "git branch -f" });
assert.equal(await forceHandoffBranch(branchParams, deps), null);
assert.deepEqual(calls.at(-1), ["/repo", ["branch", "-f", "feature", "abc1234"], host]);
results.push({ success: false, stdout: "", stderr: "", command: "git branch -f" });
const forceError = await forceHandoffBranch(branchParams, deps);
assert.equal(forceError.message, "Failed to update destination branch");
assert.equal(forceError.execOutput.formatted.fallbackOutput, forceError.message);

calls.length = 0;
assert.equal(await resolveHandoffStashReference("/repo", "stash@{2}", host, deps), "stash@{2}");
assert.equal(calls.length, 0);
results.push({ success: false, stdout: "" });
assert.equal(await resolveHandoffStashReference("/repo", "abc1234", host, deps), "abc1234");
results.push({ success: true, stdout: "" });
assert.equal(await resolveHandoffStashReference("/repo", "abc1234", host, deps), "abc1234");
results.push({
  success: true,
  stdout: "deadbee stash@{0}\n  abc1234   stash@{3}  \n",
});
assert.equal(await resolveHandoffStashReference("/repo", "abc1234", host, deps), "stash@{3}");
results.push({ success: true, stdout: "deadbee stash@{0}\n" });
assert.equal(await resolveHandoffStashReference("/repo", "abc1234", host, deps), "abc1234");

assert.deepEqual(await applyHandoffStash({ cwd: "  ", stashRef: "abc1234" }, host, deps), {
  status: "error",
  error: "No workspace available for stash apply",
});
assert.deepEqual(await applyHandoffStash({ cwd: "/repo", stashRef: "  " }, host, deps), {
  status: "error",
  error: "Stash reference is required",
});

calls.length = 0;
results.push({ success: true, stdout: "" });
assert.deepEqual(await applyHandoffStash({ cwd: " /repo ", stashRef: " stash@{1} " }, host, deps), {
  status: "success",
  stashRef: "stash@{1}",
  mode: "apply",
});
assert.deepEqual(calls.at(-1), ["/repo", ["stash", "apply", "stash@{1}"], host]);

calls.length = 0;
results.push(
  { success: true, stdout: "abc1234 stash@{4}\n" },
  { success: true, stdout: "", stderr: "", command: "git stash pop" },
);
assert.deepEqual(await applyHandoffStash({ cwd: "/repo", stashRef: "abc1234", mode: "pop" }, host, deps), {
  status: "success",
  stashRef: "abc1234",
  mode: "pop",
});
assert.deepEqual(calls.at(-1), ["/repo", ["stash", "pop", "stash@{4}"], host]);

results.push({ success: false, stdout: "apply stdout", stderr: "", command: "git stash apply" });
const stashError = await applyHandoffStash({ cwd: "/repo", stashRef: "stash@{1}" }, host, deps);
assert.equal(stashError.status, "error");
assert.equal(stashError.error, "apply stdout");
assert.equal(stashError.execOutput.formatted.fallbackOutput, "apply stdout");

console.log("34 worker git handoff branch assertions passed");
