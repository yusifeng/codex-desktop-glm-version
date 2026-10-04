import assert from "node:assert/strict";

const { waitForCleanupWithTimeout } = await import("../app/.vite/build/main-app/startup/cleanup-timeout.js");

const settled = await Promise.race([
  waitForCleanupWithTimeout(async () => {}, 100),
  new Promise((resolve) => setTimeout(() => resolve("timeout"), 500)),
]);
assert.equal(settled, undefined, "resolves after cleanup succeeds");

const rejected = await Promise.race([
  waitForCleanupWithTimeout(async () => { throw new Error("cleanup failed"); }, 100),
  new Promise((resolve) => setTimeout(() => resolve("timeout"), 500)),
]);
assert.equal(rejected, undefined, "resolves after cleanup rejection");

const started = Date.now();
await waitForCleanupWithTimeout(() => new Promise(() => {}), 25);
assert.ok(Date.now() - started >= 15, "waits for timeout when cleanup never settles");

console.log("main cleanup timeout tests passed (4 assertions)");
