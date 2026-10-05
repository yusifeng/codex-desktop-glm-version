import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { quoteGitDiffPath } = require("../app/.vite/build/worker/git-diff-quote-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(quoteGitDiffPath("src/file.ts"), "src/file.ts"); eq(quoteGitDiffPath("a\\b"), '"a\\\\b"'); eq(quoteGitDiffPath('a"b'), '"a\\"b"'); eq(quoteGitDiffPath("a\nb"), '"a\\nb"'); eq(quoteGitDiffPath("a\tb"), '"a\\tb"');
console.log(`${n} worker diff quote policy assertions passed`);
