import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { startGitRepoWatcher } = require("../app/.vite/build/worker/git-repo-watcher-start-controller.js");

function createHarness(overrides = {}) {
  const events = [];
  const targets = [];
  let disposed = false;
  let pathApi = null;
  let gitDir = null;
  let headState = null;
  let fallbackCalls = 0;

  const addDirectoryWatchTarget = (watchPath, changeType, predicate, recursive = true, parentPath) => {
    let target = targets.find((candidate) => candidate.watchPath === watchPath && candidate.recursive === recursive);
    const handler = { changeType, predicate };
    if (target == null) {
      target = {
        handlers: [handler],
        metadataDirectory: parentPath == null ? null : { parentPath, missing: false },
        recursive,
        session: null,
        watchPath,
      };
      targets.push(target);
    } else {
      target.handlers.push(handler);
    }
    return target;
  };

  const dependencies = {
    isDisposed: () => disposed,
    logStart: () => events.push(`log`),
    getTargets: () => targets,
    retryInactiveTargets: async () => { events.push(`retry`); },
    getPlatformPath: async () => path.posix,
    setPathApi: (value) => { pathApi = value; events.push(`path-api`); },
    trace: async (span, operation) => {
      events.push(`trace:${span.name}`);
      return operation();
    },
    hostKind: `local`,
    prefetchMetadata: async () => ({
      gitDir: `/repo/.git/worktrees/current`,
      headPath: `/repo/.git/worktrees/current/HEAD`,
      headRef: `refs/heads/feature/test`,
      indexPath: `/repo/.git/worktrees/current/index`,
      syncedBranchPath: `/repo/.git/worktrees/current/codex-synced-branch`,
    }),
    loadFallbackMetadata: async () => {
      fallbackCalls += 1;
      return [`/fallback/HEAD`, `/fallback/index`, `/fallback/synced`, `/fallback`, { type: `unknown` }];
    },
    commonDir: `/repo/.git`,
    root: `/repo`,
    setGitDir: (value) => { gitDir = value; events.push(`git-dir`); },
    setHeadRefState: (value, known) => { headState = { path: value, known }; events.push(`head-state`); },
    addWatchTarget: (api, filePath, changeType) => {
      if (!filePath) return;
      return addDirectoryWatchTarget(api.dirname(filePath), changeType, (candidate) => candidate === filePath, false);
    },
    addDirectoryWatchTarget,
    isHeadRefPath: (_api, _headsPath, candidate) => candidate === `/repo/.git/refs/heads/feature/test`,
    startSession: async (target, recovering) => {
      assert.equal(recovering, false);
      events.push(`start:${target.watchPath}`);
      target.session = {};
    },
    refreshMetadata: async (paths, recovering) => {
      assert.deepEqual(paths, []);
      assert.equal(recovering, false);
      events.push(`refresh`);
    },
    ...overrides,
  };

  return {
    dependencies,
    events,
    targets,
    get disposed() { return disposed; },
    set disposed(value) { disposed = value; },
    get fallbackCalls() { return fallbackCalls; },
    get gitDir() { return gitDir; },
    get headState() { return headState; },
    get pathApi() { return pathApi; },
  };
}

const disposedHarness = createHarness({ isDisposed: () => true });
await startGitRepoWatcher(disposedHarness.dependencies);
assert.deepEqual(disposedHarness.events, []);

const retryHarness = createHarness();
retryHarness.targets.push({ watchPath: `/existing`, recursive: false, handlers: [] });
await startGitRepoWatcher(retryHarness.dependencies);
assert.deepEqual(retryHarness.events, [`log`, `retry`]);

const harness = createHarness();
await startGitRepoWatcher(harness.dependencies);
assert.equal(harness.pathApi, path.posix);
assert.equal(harness.gitDir, `/repo/.git/worktrees/current`);
assert.deepEqual(harness.headState, {
  path: `/repo/.git/refs/heads/feature/test`,
  known: true,
});
assert.equal(harness.fallbackCalls, 0);
assert.equal(harness.targets.every((target) => target.session != null), true);
assert.equal(harness.events.at(-1), `refresh`);
assert.ok(harness.events.indexOf(`trace:git.watcher_targets`) < harness.events.indexOf(`refresh`));

const worktreeTarget = harness.targets.find((target) => target.watchPath === `/repo/.git/worktrees/current`);
assert.deepEqual(worktreeTarget.metadataDirectory, {
  parentPath: `/repo/.git/worktrees`,
  missing: false,
});

const headsTarget = harness.targets.find((target) => target.watchPath === `/repo/.git/refs/heads` && target.recursive);
const headHandler = headsTarget.handlers.find((handler) => handler.changeType === `head`);
const localHandler = headsTarget.handlers.find((handler) => handler.changeType === `local-refs`);
assert.equal(headHandler.predicate(`/repo/.git/refs/heads/feature/test`, new Map()), true);
assert.equal(headHandler.predicate(`/repo/.git/refs/heads/feature/test.lock`, new Map()), false);
assert.equal(localHandler.predicate(`/repo/.git/refs/heads/other`, new Map()), true);

const topologyTarget = harness.targets.find((target) => target.watchPath === `/repo/.git/worktrees`);
const topologyHandler = topologyTarget.handlers.find((handler) => handler.changeType === `worktree-topology`);
assert.equal(topologyHandler.predicate(`/repo/.git/worktrees/other/HEAD`, new Map()), true);
assert.equal(topologyHandler.predicate(`/repo/.git/worktrees/other/objects`, new Map()), false);

const workingTreeTarget = harness.targets.find((target) => target.watchPath === `/repo` && target.recursive);
const workingTreeHandler = workingTreeTarget.handlers.find((handler) => handler.changeType === `working-tree`);
assert.equal(workingTreeHandler.predicate(`/repo/file.txt`, new Map()), true);
assert.equal(workingTreeHandler.predicate(`/repo/.git/index`, new Map()), false);

const fallbackHarness = createHarness({ prefetchMetadata: async () => null });
await startGitRepoWatcher(fallbackHarness.dependencies);
assert.equal(fallbackHarness.fallbackCalls, 1);
assert.deepEqual(fallbackHarness.headState, { path: null, known: false });
assert.equal(fallbackHarness.gitDir, `/fallback`);

let raceDisposed = false;
const raceHarness = createHarness({
  isDisposed: () => raceDisposed,
  prefetchMetadata: async () => {
    raceDisposed = true;
    return null;
  },
});
await startGitRepoWatcher(raceHarness.dependencies);
assert.equal(raceHarness.targets.length, 0);
assert.equal(raceHarness.events.includes(`refresh`), false);

console.log("25 worker GitRepoWatcher start-controller assertions passed");
