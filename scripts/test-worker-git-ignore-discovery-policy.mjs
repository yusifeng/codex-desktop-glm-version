import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseGitConfigurationPathOutput, sortedIndex } = require("../app/.vite/build/worker/git-ignore-discovery-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(parseGitConfigurationPathOutput("/etc/gitconfig\n"), "/etc/gitconfig");
assert.throws(()=>parseGitConfigurationPathOutput("/etc/gitconfig"), /Invalid Git configuration path output/); n++;
assert.deepEqual([sortedIndex([], "a"), sortedIndex(["a","c"], "b"), sortedIndex(["a","c"], "c"), sortedIndex(["a","c"], "z")], [0,1,1,2]); n++;
console.log(`${n} worker git ignore discovery policy assertions passed`);
