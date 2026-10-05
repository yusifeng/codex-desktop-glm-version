import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isDiskNotFoundError } = require("../app/.vite/build/worker/git-cat-file-disk-error-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
const enoent=new Error("permission"); enoent.code="ENOENT";
eq(isDiskNotFoundError(enoent), true); eq(isDiskNotFoundError(new Error("No such file or directory")), true); eq(isDiskNotFoundError(new Error("cannot open object")), true); eq(isDiskNotFoundError(new Error("object not found")), true); eq(isDiskNotFoundError(new Error("permission denied")), false); eq(isDiskNotFoundError("not found"), false);
console.log(`${n} worker cat-file disk error policy assertions passed`);
