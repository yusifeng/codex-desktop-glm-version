import assert from "node:assert/strict";
import { isPathWithinManagedRoot, normalizeComparisonRoot } from "../app/.vite/build/worker/git-worktree-resolution-policy.js";

const normalize = (value) => value.replaceAll("\\", "/");
assert.equal(normalizeComparisonRoot("/repo/main///", normalize), "/repo/main");
assert.equal(isPathWithinManagedRoot("/repo/main/nested", "/repo/main", normalize), true);
assert.equal(isPathWithinManagedRoot("/repo/main-other", "/repo/main", normalize), false);
assert.equal(isPathWithinManagedRoot("/", "/", normalize), true);

console.log("worker git worktree resolution policy assertions passed (4)");
