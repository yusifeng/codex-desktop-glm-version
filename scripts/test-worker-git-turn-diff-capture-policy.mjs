import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const policy = require("../app/.vite/build/worker/git-turn-diff-capture-policy.js");
let count = 0;
const equal = (...args) => { count++; assert.equal(...args); };

equal(policy.buildCaptureRefPrefix(42, "id"), "refs/codex/turn-diffs/captures/42/id");
equal(policy.buildCheckpointScopeRefPrefix("scope"), "refs/codex/turn-diffs/checkpoints/scope");
equal(policy.buildCheckpointRefPrefix("scope", "turn"), "refs/codex/turn-diffs/checkpoints/scope/turn");
equal(policy.checkpointRefTimestamp("refs/x/100/id", "refs/x"), 100);
equal(policy.checkpointRefTimestamp("refs/x/not-a-time/id", "refs/x"), null);
equal(policy.isRefStale({ ref: "refs/x/100/id", refPrefix: "refs/x", nowMs: 250, ttlMs: 100 }), true);
equal(policy.isRefStale({ ref: "refs/x/150/id", refPrefix: "refs/x", nowMs: 250, ttlMs: 100 }), false);
equal(
  policy.selectLatestCheckpoint({
    output: "refs/x/100/a old\nrefs/x/800/b recent\nrefs/x/900/c latest\nrefs/x/nope/d bad\n",
    refPrefix: "refs/x",
    nowMs: 1000,
    ttlMs: 700,
    normalizeTreeSha: (sha) => `normalized:${sha}`,
  }),
  "normalized:latest",
);
equal(
  policy.selectLatestCheckpoint({
    output: "refs/x/100/a old\nrefs/x/200/b stale\n",
    refPrefix: "refs/x",
    nowMs: 1000,
    ttlMs: 100,
    normalizeTreeSha: (sha) => sha,
  }),
  null,
);
console.log(`${count} worker git turn-diff capture policy assertions passed`);
