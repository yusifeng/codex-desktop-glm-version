import assert from "node:assert/strict";
import { normalizeTurnDiffTreeOutput } from "../app/.vite/build/worker/git-turn-diff-snapshot-policy.js";
assert.equal(normalizeTurnDiffTreeOutput(" abc \n", (value) => value === "abc", (value) => `tree:${value}`), "tree:abc");
assert.throws(() => normalizeTurnDiffTreeOutput("bad", () => false, (value) => value), /Unexpected tree SHA/);
console.log("worker git turn diff snapshot policy assertions passed (2)");
