import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { classifyCheckoutFailure, parseCheckoutConflictPaths } = require(
  "../app/.vite/build/worker/git-checkout-conflict-policy.js",
);
let assertions = 0;
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(parseCheckoutConflictPaths(
  "error: Your local changes to the following files would be overwritten by checkout:\n  src/a.ts\n  src/a.ts\nPlease commit your changes or stash them before you switch branches.\nAborting",
), { hasConflictHeader: true, conflictedPaths: ["src/a.ts"] });
deepEqual(parseCheckoutConflictPaths("fatal: unrelated failure"), { hasConflictHeader: false, conflictedPaths: [] });
deepEqual(parseCheckoutConflictPaths("error: would be overwritten by checkout:\nREADME.md\nerror: stop"), { hasConflictHeader: true, conflictedPaths: ["README.md"] });
deepEqual(classifyCheckoutFailure("", "error: local changes would be overwritten by checkout:\nfile.txt"), {
  errorType: "blocked-by-working-tree-changes", conflictedPaths: ["file.txt"],
});
deepEqual(classifyCheckoutFailure("fatal: branch not found", ""), { errorType: "unknown", conflictedPaths: [] });
console.log(`${assertions} worker checkout conflict policy assertions passed`);
