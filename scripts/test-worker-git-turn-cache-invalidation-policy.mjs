import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { shouldInvalidateGitWorktreeForTurn } = require("../app/.vite/build/worker/git-turn-cache-invalidation-policy.js");
const base = { isSelected: false, hasUnknownSelectedCommonDir: false, commonDir: "/repo/.git", selectedCommonDirs: new Set(["/repo/.git"]) };
assert.equal(shouldInvalidateGitWorktreeForTurn(base), true);
assert.equal(shouldInvalidateGitWorktreeForTurn({ ...base, commonDir: "/other/.git" }), false);
assert.equal(shouldInvalidateGitWorktreeForTurn({ ...base, isSelected: true, commonDir: "/other/.git" }), true);
assert.equal(shouldInvalidateGitWorktreeForTurn({ ...base, hasUnknownSelectedCommonDir: true, commonDir: "/other/.git" }), true);
assert.equal(shouldInvalidateGitWorktreeForTurn({ ...base, commonDir: null }), true);

console.log("5 worker git turn cache invalidation assertions passed");
