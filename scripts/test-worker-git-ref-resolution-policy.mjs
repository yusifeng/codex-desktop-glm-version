import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isGitObjectId, normalizeGitObjectIdOutput } = require(
  "../app/.vite/build/worker/git-ref-resolution-policy.js",
);

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };

for (const value of ["abcdef0", "A".repeat(40), "0123456789abcdef"])
  equal(isGitObjectId(value), true);
for (const value of ["abcdef", "a".repeat(41), "xyzxyzx", "", "abc def0"])
  equal(isGitObjectId(value), false);
equal(normalizeGitObjectIdOutput(" ABCDEF0\n"), "ABCDEF0");
equal(normalizeGitObjectIdOutput("  \n"), null);
equal(normalizeGitObjectIdOutput("not-an-object-id"), undefined);

console.log(`${assertions} worker git ref resolution policy assertions passed`);
