import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createGitWorkerResponse } = require("../app/.vite/build/worker/git-response-envelope-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
eq(createGitWorkerResponse({ id:"1", method:"status", result:{ok:true} }), { id:"1", method:"status", result:{ok:true} });
eq(createGitWorkerResponse({ id:"2", method:"status", result:null, trace:{requestId:"r"}, emittedAtMs:123 }), { id:"2", method:"status", result:null, trace:{requestId:"r"}, emittedAtMs:123 });
eq(createGitWorkerResponse({ id:"3", method:"status", result:0, trace:null }), { id:"3", method:"status", result:0 });
console.log(`${n} worker response envelope policy assertions passed`);
