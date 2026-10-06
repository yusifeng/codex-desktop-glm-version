import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  parseRemoteHeadBranch,
  parseRemoteShowDefaultBranch,
  parseRemoteNames,
  parseUpstreamRef,
  selectConventionalBranch,
} = require("../app/.vite/build/worker/git-remote-branches-policy.js");

let assertions = 0;
const equal = (a, b) => { assertions += 1; assert.equal(a, b); };
const deepEqual = (a, b) => { assertions += 1; assert.deepEqual(a, b); };
equal(parseUpstreamRef(" origin/main \n"), "origin/main");
equal(parseUpstreamRef("\n"), null);
equal(parseUpstreamRef(null), null);
equal(parseRemoteHeadBranch("refs/remotes/origin/main", "origin"), "main");
equal(parseRemoteHeadBranch("refs/remotes/upstream/main", "origin"), null);
equal(parseRemoteHeadBranch("refs/remotes/origin/", "origin"), null);
equal(parseRemoteShowDefaultBranch("Fetch URL: x\n HEAD branch: trunk \n"), "trunk");
equal(parseRemoteShowDefaultBranch("HEAD branch: (unknown)"), null);
deepEqual(parseRemoteNames(" upstream\norigin\nbackup\n\n"), ["origin", "upstream", "backup"]);
deepEqual(parseRemoteNames(null), []);
equal(selectConventionalBranch(true, true), "main");
equal(selectConventionalBranch(false, true), "master");
equal(selectConventionalBranch(false, false), null);
console.log(`${assertions} worker git remote branches policy assertions passed`);
