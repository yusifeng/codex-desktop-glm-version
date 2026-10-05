import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { findCaseInsensitiveOffsets } = require("../app/.vite/build/worker/git-review-search-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
eq(findCaseInsensitiveOffsets("Abc abc ABC","abc",2), {offsets:[{start:0,end:3},{start:4,end:7}],totalMatches:3,isCapped:true});
eq(findCaseInsensitiveOffsets("abc abc","abc",0), {offsets:[],totalMatches:2,isCapped:true});
eq(findCaseInsensitiveOffsets("abc","z",3), {offsets:[],totalMatches:0,isCapped:false});
console.log(`${n} worker review search policy assertions passed`);
