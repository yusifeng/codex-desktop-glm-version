import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { classifyGitDiffHeader } = require("../app/.vite/build/worker/git-diff-header-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(classifyGitDiffHeader("diff --cc file"), "combined"); eq(classifyGitDiffHeader("diff --combined file"), "combined"); eq(classifyGitDiffHeader("diff --git a/x b/x"), "git"); eq(classifyGitDiffHeader("diff --raw"), null); eq(classifyGitDiffHeader(""), null);
console.log(`${n} worker diff header policy assertions passed`);
