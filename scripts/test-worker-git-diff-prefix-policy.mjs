import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { stripGitDiffPrefixes } = require("../app/.vite/build/worker/git-diff-prefix-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
eq(stripGitDiffPrefixes("a/src/old.ts","b/src/new.ts"), {oldPath:"src/old.ts",newPath:"src/new.ts"});
eq(stripGitDiffPrefixes("src/old.ts","b/src/new.ts"), null); eq(stripGitDiffPrefixes("a/src/old.ts","src/new.ts"), null); eq(stripGitDiffPrefixes("a/","b/"), {oldPath:"",newPath:""});
console.log(`${n} worker diff prefix policy assertions passed`);
