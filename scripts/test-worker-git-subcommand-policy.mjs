import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { gitSubcommand } = require("../app/.vite/build/worker/git-subcommand-policy.js");
let n=0; const eq=(...a)=>{n++;assert.equal(...a)};
eq(gitSubcommand(["-c","core.fsmonitor=true","status"],0), "status");
eq(gitSubcommand(["--git-dir",".git","log"],2), "log");
eq(gitSubcommand(["unknown"],0), "other"); eq(gitSubcommand(null,0), "other"); eq(gitSubcommand(["-c"],0), "other");
console.log(`${n} worker git subcommand policy assertions passed`);
