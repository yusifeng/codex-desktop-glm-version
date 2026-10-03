import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { invalidateGitReadCaches, invalidateStableMetadata } = require("../app/.vite/build/worker/git-cache-request-handlers.js");

function createFixture(overrides = {}) {
  const events = [];
  const repository = {
    clearShortLivedGitReadCaches() {
      events.push(["clear-short", repository]);
    },
  };
  const deps = {
    gitManager: {
      invalidateStableMetadata() {
        events.push(["invalidate-stable"]);
      },
      getWorktreeRepositoryForRoot(root, host) {
        events.push(["get-repository", root, host]);
        return repository;
      },
    },
    host: { id: "local" },
    invalidateUntrackedPathsCache(repo) {
      events.push(["clear-untracked", repo]);
    },
    refreshRepository(hostId, root) {
      events.push(["refresh", hostId, root]);
    },
    ...overrides,
  };
  return { deps, events, repository };
}

{
  const { deps, events } = createFixture();
  assert.deepEqual(invalidateStableMetadata(deps), { success: true });
  assert.deepEqual(events, [["invalidate-stable"]]);
}

{
  const { deps } = createFixture({ gitManager: { invalidateStableMetadata() { throw new Error("stable failed"); } } });
  assert.throws(() => invalidateStableMetadata(deps), /stable failed/);
}

{
  const { deps, events, repository } = createFixture();
  assert.deepEqual(invalidateGitReadCaches({ root: "/repo", clearUntrackedPathsCache: false }, deps), { success: true });
  assert.deepEqual(events, [["get-repository", "/repo", deps.host], ["clear-short", repository]]);
}

{
  const { deps, events, repository } = createFixture();
  assert.deepEqual(invalidateGitReadCaches({ root: "/repo", clearUntrackedPathsCache: true }, deps), { success: true });
  assert.deepEqual(events, [
    ["get-repository", "/repo", deps.host],
    ["clear-untracked", repository],
    ["clear-short", repository],
    ["refresh", "local", "/repo"],
  ]);
}

{
  let resolveRefresh;
  const pendingRefresh = new Promise((resolve) => { resolveRefresh = resolve; });
  const { deps } = createFixture({ refreshRepository: () => pendingRefresh });
  assert.deepEqual(invalidateGitReadCaches({ root: "/repo", clearUntrackedPathsCache: true }, deps), { success: true });
  let settled = false;
  pendingRefresh.then(() => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false);
  resolveRefresh();
}

{
  const events = [];
  const { deps } = createFixture({
    gitManager: {
      getWorktreeRepositoryForRoot() {
        events.push("get-repository");
        throw new Error("repo failed");
      },
    },
    invalidateUntrackedPathsCache() { events.push("clear-untracked"); },
    refreshRepository() { events.push("refresh"); },
  });
  assert.throws(() => invalidateGitReadCaches({ root: "/repo", clearUntrackedPathsCache: true }, deps), /repo failed/);
  assert.deepEqual(events, ["get-repository"]);
}

{
  const events = [];
  const repository = { clearShortLivedGitReadCaches() { events.push("clear-short"); } };
  const { deps } = createFixture({
    gitManager: { getWorktreeRepositoryForRoot() { events.push("get-repository"); return repository; } },
    invalidateUntrackedPathsCache() { events.push("clear-untracked"); throw new Error("untracked failed"); },
    refreshRepository() { events.push("refresh"); },
  });
  assert.throws(() => invalidateGitReadCaches({ root: "/repo", clearUntrackedPathsCache: true }, deps), /untracked failed/);
  assert.deepEqual(events, ["get-repository", "clear-untracked"]);
}

{
  const events = [];
  const repository = { clearShortLivedGitReadCaches() { events.push("clear-short"); throw new Error("short failed"); } };
  const { deps } = createFixture({
    gitManager: { getWorktreeRepositoryForRoot() { events.push("get-repository"); return repository; } },
    invalidateUntrackedPathsCache() { events.push("clear-untracked"); },
    refreshRepository() { events.push("refresh"); },
  });
  assert.throws(() => invalidateGitReadCaches({ root: "/repo", clearUntrackedPathsCache: true }, deps), /short failed/);
  assert.deepEqual(events, ["get-repository", "clear-untracked", "clear-short"]);
}

{
  const events = [];
  const repository = { clearShortLivedGitReadCaches() { events.push("clear-short"); } };
  const { deps } = createFixture({
    gitManager: { getWorktreeRepositoryForRoot() { events.push("get-repository"); return repository; } },
    invalidateUntrackedPathsCache() { events.push("clear-untracked"); },
    refreshRepository() { events.push("refresh"); throw new Error("refresh failed"); },
  });
  assert.throws(() => invalidateGitReadCaches({ root: "/repo", clearUntrackedPathsCache: true }, deps), /refresh failed/);
  assert.deepEqual(events, ["get-repository", "clear-untracked", "clear-short", "refresh"]);
}

console.log("17 worker git cache request handler assertions passed");
