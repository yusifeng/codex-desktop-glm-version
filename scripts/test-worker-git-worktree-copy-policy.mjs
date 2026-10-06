import assert from "node:assert/strict";
import { filterAgentOverridePaths } from "../app/.vite/build/worker/git-worktree-copy-policy.js";
assert.deepEqual(filterAgentOverridePaths("AGENTS.override.md\0src/AGENTS.override.md\0src/AGENTS.override.md\0x.md\0"), ["AGENTS.override.md", "src/AGENTS.override.md"]);
console.log("worker git worktree copy policy assertions passed (1)");
