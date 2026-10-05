import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createLineDecoder } = require("../app/.vite/build/worker/git-review-line-decoder-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
const lines=[]; const decode=createLineDecoder((line)=>lines.push(line)); const bytes=new TextEncoder();
decode(bytes.encode("one\ntwo")); eq(lines,["one"]); decode(bytes.encode("\nthree\n")); eq(lines,["one","two","three"]); decode(bytes.encode("tail")); eq(lines,["one","two","three"]);
console.log(`${n} worker review line decoder policy assertions passed`);
