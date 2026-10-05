import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { projectCurrentBranchState } = require(
  "../app/.vite/build/worker/git-current-branch-policy.js",
);

let assertions = 0;
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(projectCurrentBranchState({ success: true, stdout: "main" }, { success: true, stdout: "ignored" }), { type: "branch", branch: "main" });
deepEqual(projectCurrentBranchState({ success: true, stdout: "HEAD" }, { success: true, stdout: "topic" }), { type: "branch", branch: "topic" });
deepEqual(projectCurrentBranchState({ success: false }, { success: false, code: 1 }), { type: "detached" });
deepEqual(projectCurrentBranchState({ success: false }, { success: false, code: 128 }), { type: "unknown" });
deepEqual(projectCurrentBranchState(null, null), { type: "unknown" });

console.log(`${assertions} worker git current branch policy assertions passed`);
