import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { classifyBranchComparison, parseLeftRightCommitCounts } = require("../app/.vite/build/worker/git-branch-comparison-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
eq(parseLeftRightCommitCounts(" 2\t3\n"), {leftAhead:2,rightAhead:3}); eq(parseLeftRightCommitCounts(""), null); eq(parseLeftRightCommitCounts("two 3"), null);
eq(classifyBranchComparison({leftAhead:0,rightAhead:0}), "equal"); eq(classifyBranchComparison({leftAhead:2,rightAhead:0}), "left-ahead"); eq(classifyBranchComparison({leftAhead:0,rightAhead:3}), "right-ahead"); eq(classifyBranchComparison({leftAhead:1,rightAhead:1}), "diverged");
console.log(`${n} worker branch comparison policy assertions passed`);
