import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildAheadRevisionArgs,
  buildRemoteAncestorRevision,
  normalizeRemoteUpstream,
  parseCommitCount,
  resolveDefaultBranchRevision,
} = require("../app/.vite/build/worker/git-branch-ahead-policy.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

equal(parseCommitCount("12\n"), 12);
equal(parseCommitCount(""), null);
equal(parseCommitCount("unknown"), null);

equal(normalizeRemoteUpstream("remotes/origin/main", "origin"), "origin/main");
equal(normalizeRemoteUpstream("origin/main", "origin"), "origin/main");
equal(normalizeRemoteUpstream(null, "origin"), null);
equal(buildRemoteAncestorRevision("remotes/origin/main", "origin"), "refs/remotes/origin/main");
equal(buildRemoteAncestorRevision("origin/main", "origin"), "refs/remotes/origin/main");
equal(buildRemoteAncestorRevision("main", "origin"), null);
equal(buildRemoteAncestorRevision("origin/main", null), null);
equal(resolveDefaultBranchRevision("main", "origin"), "origin/main");
equal(resolveDefaultBranchRevision("refs/remotes/upstream/main", "origin"), "refs/remotes/upstream/main");
equal(resolveDefaultBranchRevision("main", null), "main");
deepEqual(buildAheadRevisionArgs("origin/main"), ["origin/main..HEAD"]);
deepEqual(buildAheadRevisionArgs("abc123"), ["abc123..HEAD"]);

console.log(`${assertions} worker git branch ahead policy assertions passed`);
