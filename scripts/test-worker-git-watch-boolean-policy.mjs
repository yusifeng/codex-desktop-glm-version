import assert from "node:assert/strict";
import { combineGitWatchOptionalBooleans } from "../app/.vite/build/worker/git-watch-boolean-policy.js";
assert.equal(combineGitWatchOptionalBooleans([false, null]), null);
assert.equal(combineGitWatchOptionalBooleans([false, false]), false);
assert.equal(combineGitWatchOptionalBooleans([null, true]), true);
console.log("worker git watch boolean policy assertions passed (3)");
