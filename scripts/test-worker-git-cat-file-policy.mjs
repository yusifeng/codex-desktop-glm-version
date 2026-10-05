import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isQueryableOid } = require("../app/.vite/build/worker/git-cat-file-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(isQueryableOid("abc123"), true); eq(isQueryableOid("0"), false); eq(isQueryableOid("0000"), false); eq(isQueryableOid("000a"), true); eq(isQueryableOid(null), false); eq(isQueryableOid(""), false);
console.log(`${n} worker cat-file policy assertions passed`);
