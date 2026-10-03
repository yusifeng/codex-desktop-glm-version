import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { GitIgnorePolicy } = require("../app/.vite/build/worker/git-ignore-policy.js");
let timerCallback;
const timers = [];
const recoveryChanges = [];
let reads = 0;
let refreshes = 0;
const policy = new GitIgnorePolicy({
  readIgnoredDirectories: async () => { reads += 1; return ["ignored"]; },
  refresh: async () => { refreshes += 1; },
  onRequiresRecoveryChanged: () => recoveryChanges.push(policy.requiresRecovery),
  setTimeoutFn: (callback, delay) => { timerCallback = callback; timers.push(delay); return callback; },
  clearTimeoutFn: () => {},
});
assert.deepEqual(await policy.read(), { generation: 0, directories: ["ignored"] });
assert.deepEqual(await policy.read(), { generation: 0, directories: ["ignored"] });
assert.equal(reads, 1);
const stale = await policy.read({ refresh: true });
assert.equal(stale.generation, 0);
policy.requestRefresh();
assert.equal(timers.at(-1), 1000);
timerCallback();
await Promise.resolve();
assert.equal(refreshes, 1);
assert.equal(policy.didApply({ generation: 1, directories: [] }), true);
assert.equal(policy.requiresRecovery, false);
let failed = true;
const failing = new GitIgnorePolicy({
  readIgnoredDirectories: async () => { if (failed) throw Error("read"); return []; },
  refresh: async () => { throw Error("refresh"); },
  onRequiresRecoveryChanged: () => {},
  setTimeoutFn: (callback) => { timerCallback = callback; return callback; },
  clearTimeoutFn: () => {},
});
await assert.rejects(failing.read(), /read/);
assert.equal(failing.requiresRecovery, true);
await failing.dispose();
assert.equal(failing.isCurrent({ generation: 0, directories: [] }), false);
failed = false;

console.log("10 worker git ignore policy assertions passed");
