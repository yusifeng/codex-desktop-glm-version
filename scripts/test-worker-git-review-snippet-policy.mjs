import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { buildSearchSnippet } = require("../app/.vite/build/worker/git-review-snippet-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
eq(buildSearchSnippet("0123456789",4,6,2), {before:"23",match:"45",after:"67"});
eq(buildSearchSnippet("hello",0,2,30), {before:"",match:"he",after:"llo"});
eq(buildSearchSnippet("hello",3,5,0), {before:"",match:"lo",after:""});
console.log(`${n} worker review snippet policy assertions passed`);
