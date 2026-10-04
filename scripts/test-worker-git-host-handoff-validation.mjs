import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateHostHandoffParams } = require("../app/.vite/build/worker/git-host-handoff-validation.js");
let assertions = 0;
const equal = (...args) => { assertions += 1; assert.deepEqual(...args); };
const base = { sourceRolloutPath: "/rollout", sourceBranch: "main", destinationWorktreeGitRoot: null, destinationWorktreeWorkspaceRoot: null };
equal(validateHostHandoffParams(base), null);
equal(validateHostHandoffParams({ ...base, sourceRolloutPath: "  " }), { status: "error", error: "invalid-params", message: "Missing source rollout path" });
equal(validateHostHandoffParams({ ...base, sourceRolloutPath: null }), { status: "error", error: "invalid-params", message: "Missing source rollout path" });
equal(validateHostHandoffParams({ ...base, sourceBranch: "  " }), { status: "error", error: "invalid-params", message: "Missing source branch" });
equal(validateHostHandoffParams({ ...base, sourceBranch: 42 }), { status: "error", error: "invalid-params", message: "Missing source branch" });
equal(validateHostHandoffParams({ ...base, destinationWorktreeGitRoot: "/git" }), { status: "error", error: "invalid-params", message: "Destination worktree roots must be provided together" });
equal(validateHostHandoffParams({ ...base, destinationWorktreeWorkspaceRoot: "/workspace" }), { status: "error", error: "invalid-params", message: "Destination worktree roots must be provided together" });
equal(validateHostHandoffParams({ ...base, destinationWorktreeGitRoot: "/git", destinationWorktreeWorkspaceRoot: "/workspace" }), null);
console.log(`test-worker-git-host-handoff-validation: ${assertions} assertions passed`);
