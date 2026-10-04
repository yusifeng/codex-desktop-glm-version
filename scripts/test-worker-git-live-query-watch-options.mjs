import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getLiveQueryWatchOptions } = require(
  "../app/.vite/build/worker/git-live-query-watch-options.js",
);

assert.deepEqual(getLiveQueryWatchOptions(null), { live: false });
assert.deepEqual(getLiveQueryWatchOptions(undefined), { live: false });
assert.deepEqual(getLiveQueryWatchOptions({}), { live: true });
assert.deepEqual(getLiveQueryWatchOptions({ watcher: {} }), { live: true });
assert.deepEqual(
  getLiveQueryWatchOptions({ watcher: { requiresRecovery: true } }),
  { live: false },
);
assert.deepEqual(
  getLiveQueryWatchOptions({ watcher: { requiresRecovery: false } }),
  { live: true },
);

console.log("git live query watch options tests passed (6 assertions)");
