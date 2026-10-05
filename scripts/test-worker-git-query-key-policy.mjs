import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { fsmonitorCacheKey, gitQueryKey, hostId } = require("../app/.vite/build/worker/git-query-key-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
eq(hostId({id:"local"}), "local");
eq(gitQueryKey("/repo", {id:"local"}, "status", "short"), ["git","local","/repo","status","short"]);
eq(fsmonitorCacheKey("/repo", {id:"local"}, {Z:"z",GIT_INDEX_FILE:"/tmp/i",A:"a"}), JSON.stringify(["local","/repo",[["A","a"],["Z","z"]]]));
console.log(`${n} worker query key policy assertions passed`);
