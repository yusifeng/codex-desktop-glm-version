import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveCommonDirRoot, resolveIndexFallbackRoot } = require(
  "../app/.vite/build/worker/git-automation-writable-roots-policy.js",
);

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const p = path.posix;
equal(resolveCommonDirRoot("/common/.git", "/source", p), "/common/.git");
equal(resolveCommonDirRoot("../shared.git", "/source/nested", p), "/source/shared.git");
equal(resolveCommonDirRoot("relative.git", "/source", p), "/source/relative.git");
equal(resolveIndexFallbackRoot("/metadata/worktrees/id/index", "/source", p), "/metadata/worktrees/id");
equal(resolveIndexFallbackRoot(null, "/source", p), "/source/.git");
equal(resolveIndexFallbackRoot(null, null, p), null);
console.log(`${assertions} worker automation writable-roots policy assertions passed`);
