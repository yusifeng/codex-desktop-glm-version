import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { exitCodeBucket } = require("../app/.vite/build/worker/git-exit-code-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(exitCodeBucket(null), null); eq(exitCodeBucket(0), "other"); eq(exitCodeBucket(1), "1"); eq(exitCodeBucket(2), "2"); eq(exitCodeBucket(128), "128"); eq(exitCodeBucket(129), "129"); eq(exitCodeBucket(255), "other");
console.log(`${n} worker exit code policy assertions passed`);
