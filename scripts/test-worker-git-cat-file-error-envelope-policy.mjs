import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { unknownCatFileResult } = require("../app/.vite/build/worker/git-cat-file-error-envelope-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
eq(unknownCatFileResult(), {type:"error",error:{type:"unknown"}});
const first=unknownCatFileResult(); first.error.type="changed"; eq(unknownCatFileResult(), {type:"error",error:{type:"unknown"}});
console.log(`${n} worker cat-file error envelope policy assertions passed`);
