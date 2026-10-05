import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseNumstatValue } = require("../app/.vite/build/worker/git-review-numstat-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(parseNumstatValue("12"),12); eq(parseNumstatValue("0"),0); eq(parseNumstatValue("-"),null); eq(parseNumstatValue("binary"),null); eq(parseNumstatValue("12 trailing"),12);
console.log(`${n} worker review numstat policy assertions passed`);
