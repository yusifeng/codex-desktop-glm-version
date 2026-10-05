import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { utf8ByteLength } = require("../app/.vite/build/worker/git-output-size-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(utf8ByteLength(""), 0); eq(utf8ByteLength("abc"), 3); eq(utf8ByteLength("中文"), 6); eq(utf8ByteLength("🙂"), 4);
console.log(`${n} worker output size policy assertions passed`);
