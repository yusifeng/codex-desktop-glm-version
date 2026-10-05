import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { gitErrorType } = require("../app/.vite/build/worker/git-cat-file-error-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(gitErrorType({code:128}), "not-found"); eq(gitErrorType({code:1}), "unknown"); eq(gitErrorType({code:null}), "unknown"); eq(gitErrorType({}), "unknown");
console.log(`${n} worker cat-file error policy assertions passed`);
