import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { selectGitWatchSubscriptionState } = require("../app/.vite/build/worker/git-watch-subscription-policy.js");

assert.deepEqual(selectGitWatchSubscriptionState({
  metadata: { commonDir: "/common", root: "/repo" },
  watch: { watcher: { requiresRecovery: false } },
}), { commonDir: "/common", root: "/repo", requiresRecovery: false });
assert.deepEqual(selectGitWatchSubscriptionState({
  metadata: { commonDir: "/common", root: "/repo" },
  watch: null,
}), { commonDir: "/common", root: "/repo", requiresRecovery: true });
assert.deepEqual(selectGitWatchSubscriptionState({
  metadata: { commonDir: "/common", root: "/repo" },
  watch: { watcher: {} },
}), { commonDir: "/common", root: "/repo", requiresRecovery: true });

console.log("3 worker git watch subscription policy assertions passed");
