import assert from "node:assert/strict";
import { isNonRepositoryError } from "../app/.vite/build/worker/git-root-resolution-policy.js";
assert.equal(isNonRepositoryError("fatal: not a git repository"), true);
assert.equal(isNonRepositoryError("fatal: invalid gitfile format"), true);
assert.equal(isNonRepositoryError("fatal: permission denied"), false);
console.log("worker git root resolution policy assertions passed (3)");
