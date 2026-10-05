import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { splitContentLines } = require("../app/.vite/build/worker/git-cat-file-content-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
eq(splitContentLines(""), []); eq(splitContentLines("one\n"), ["one\n"]); eq(splitContentLines("one\ntwo"), ["one\n","two"]); eq(splitContentLines("one\n\n"), ["one\n","\n"]);
console.log(`${n} worker cat-file content policy assertions passed`);
