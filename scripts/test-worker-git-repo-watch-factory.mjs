import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createGitRepoWatch } = require("../app/.vite/build/worker/git-repo-watch-factory.js");

function createHarness({ local = true } = {}) {
  const events = [];
  const host = { id: `host-1`, isLocal: local };
  const metadata = { commonDir: `/repo/.git`, root: `/repo` };
  const repository = { id: `repository` };
  let currentWatch = null;
  let watcherOptions = null;
  let eventDependencies = null;
  const dependencies = {
    metadata,
    host,
    getWatchKey: (root, value) => `${value.id}:${root}`,
    isCurrentWatch: (_key, watch) => currentWatch === watch,
    getRepository: () => repository,
    removeOriginQueries: (value) => { assert.equal(value, repository); events.push(`origin-clear`); },
    invalidateWatchScopedCaches: (value) => { assert.equal(value, repository); events.push(`invalidate-watch`); },
    setLiveQueryRecovery: (...args) => events.push([`live-recovery`, ...args]),
    handleRepoWatchEvent: async (event, deps) => { eventDependencies = deps; events.push([`watch-event`, event]); },
    filterWorkingTreePaths: async () => ({ type: `full` }),
    getTrace: () => ({ traceId: `trace` }),
    trace: async (_options, operation) => operation(),
    invalidateAll: () => {},
    invalidateChange: () => {},
    handleRepoChanged: () => {},
    recordPerformance: (input) => events.push([`performance`, input]),
    getIndexSizeBucket: () => `small`,
    emit: (event) => events.push([`emit`, event]),
    createWatcher: (options) => { watcherOptions = options; return { kind: `watcher` }; },
    watchIgnoreSources: { kind: `ignore-source` },
    hasLocalBranchDependency: (input) => { events.push([`branch-dependency`, input]); return input.branch === `main`; },
    startMetadataWatch: async (...args) => { events.push([`metadata-watch`, ...args]); return `metadata-session`; },
    startWorkingTreeWatch: async (...args) => { events.push([`working-watch`, ...args]); return `working-session`; },
  };
  const created = createGitRepoWatch(dependencies);
  return {
    created,
    dependencies,
    events,
    host,
    metadata,
    repository,
    get eventDependencies() { return eventDependencies; },
    set currentWatch(value) { currentWatch = value; },
    get watcherOptions() { return watcherOptions; },
  };
}

const harness = createHarness();
const { watch, key } = harness.created;
assert.equal(key, `host-1:/repo`);
assert.equal(watch.commonDir, `/repo/.git`);
assert.equal(watch.closingPromise, null);
assert.equal(watch.hostId, `host-1`);
assert.equal(watch.isReady, false);
assert.equal(watch.repoIndexSizeBucket, `unknown`);
assert.equal(watch.refCount, 0);
assert.equal(watch.root, `/repo`);
assert.equal(watch.startPromise instanceof Promise, true);
assert.equal(watch.startTrace, undefined);
assert.deepEqual(watch.watcher, { kind: `watcher` });
assert.deepEqual(harness.events, [`origin-clear`]);
assert.equal(harness.watcherOptions.worktreeRepo, harness.repository);
assert.equal(harness.watcherOptions.watchIgnoreSources.kind, `ignore-source`);

assert.equal(harness.watcherOptions.isLocalBranchDependency(`main`), true);
assert.deepEqual(harness.events.at(-1)[1], {
  branch: `main`, commonDir: `/repo/.git`, hostId: `host-1`, root: `/repo`,
});
assert.equal(await harness.watcherOptions.startMetadataWatch({ path: `metadata` }), `metadata-session`);
assert.equal(harness.events.at(-1)[1], harness.host);
assert.equal(await harness.watcherOptions.startWorkingTreeWatch({ path: `tree` }, [`ignored`]), `working-session`);
assert.equal(harness.events.at(-1)[1], harness.host);

harness.watcherOptions.onRequiresRecoveryChanged(true);
assert.equal(harness.events.includes(`invalidate-watch`), false);
harness.currentWatch = watch;
watch.refCount = 1;
harness.watcherOptions.onRequiresRecoveryChanged(true);
assert.deepEqual(harness.events.slice(-3), [
  `invalidate-watch`, `origin-clear`, [`live-recovery`, `host-1`, `/repo`, true],
]);

harness.watcherOptions.onCoalescedChange({ changeType: `working-tree`, rawEventCount: 7 });
await harness.watcherOptions.emit({ type: `worker-event` });
assert.equal(harness.eventDependencies.isActive(), true);
assert.equal(harness.eventDependencies.getRawEventCount(`working-tree`), 7);
assert.equal(harness.eventDependencies.requiresRecovery(), true);
harness.eventDependencies.clearRawEventCount(`working-tree`);
assert.equal(harness.eventDependencies.getRawEventCount(`working-tree`), 1);

watch.closingPromise = Promise.resolve();
assert.equal(harness.eventDependencies.isActive(), false);
harness.watcherOptions.onRequiresRecoveryChanged(false);
assert.equal(harness.events.at(-1)[0], `watch-event`);

const remote = createHarness({ local: false });
assert.equal(remote.watcherOptions.watchIgnoreSources, undefined);

console.log("31 worker Git repo-watch factory assertions passed");
