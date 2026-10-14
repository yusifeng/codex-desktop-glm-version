import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { startGitRepoWatchSession } = require("../app/.vite/build/worker/git-repo-watch-session-runtime.js");

function harness(overrides = {}) {
  const events = [];
  const target = {
    generation: 1,
    handlers: [{ changeType: `working-tree` }, { changeType: `head` }],
    metadataDirectory: { missing: false },
    recursive: false,
    retryTimer: null,
    session: null,
  };
  let disposed = false;
  let current = true;
  let policyCurrent = true;
  let closeHandler = null;
  const ignorePolicy = {
    directories: [`/repo/.gitignore`],
    didApply: () => { events.push(`policy-apply`); return true; },
    requestRefresh: () => events.push(`policy-refresh`),
  };
  const dependencies = {
    target,
    recovering: false,
    generation: 1,
    isDisposed: () => disposed,
    isCurrentGeneration: () => current,
    stat: async () => ({ isDirectory: () => true }),
    isMissingPathError: (error) => error?.code === `ENOENT`,
    hasWorkingTreeHandler: true,
    readIgnorePolicy: async () => { events.push(`policy-read`); return ignorePolicy; },
    isIgnorePolicyCurrent: () => policyCurrent,
    createWatchId: () => `watch-1`,
    trace: async (_span, operation) => { events.push(`trace`); return operation(); },
    hostKind: `local`,
    startWorkingTreeWatch: async (options, directories) => {
      events.push([`working-start`, options.renameEventHandling, directories]);
      options.onChange({ changedPaths: [`/repo/file.txt`], pathChanges: [] });
      return { closed: Promise.resolve({ reason: `closed` }), dispose: async () => events.push(`dispose`) };
    },
    startFileWatch: async () => { events.push(`file-start`); return { closed: Promise.resolve({}), dispose: async () => {} }; },
    handleWatchChange: ({ changedPaths, ignoreDirectories }) => events.push([`change`, changedPaths, ignoreDirectories]),
    ignoreSourceWatch: () => ({ target }),
    changedIgnoreSourcePaths: new Set(),
    ignoreDirectories: [],
    refreshMetadataDirectories: async () => events.push(`metadata-refresh`),
    ignorePolicy,
    collectHandlerPaths: () => {},
    handleFileWatchEvent: (changeType) => events.push([`event`, changeType]),
    isRegistered: () => true,
    attachSession: (session) => { target.session = session; events.push(`attach`); },
    setWorkingTreeIgnoredDirectories: (directories) => events.push([`set-dirs`, directories]),
    updateRecovery: () => events.push(`recovery`),
    attachClosed: (_session, _startedAt) => { closeHandler = true; events.push(`closed-hook`); },
    hasPendingMetadataRefresh: () => false,
    loggerWarning: (error) => events.push([`warning`, error.message]),
    scheduleRetry: () => events.push(`retry`),
    ...overrides,
  };
  return { dependencies, events, target, ignorePolicy, set disposed(value) { disposed = value; }, get closeHandler() { return closeHandler; }, set current(value) { current = value; }, set policyCurrent(value) { policyCurrent = value; } };
}

const success = harness();
await startGitRepoWatchSession(success.dependencies);
assert.deepEqual(success.events.slice(0, 10), [
  `recovery`, `policy-read`, `trace`, [`working-start`, `changed-path-with-parent-directory`, [`/repo/.gitignore`]],
  [`change`, [`/repo/file.txt`], [`/repo/.gitignore`]],
  `attach`, [`set-dirs`, [`/repo/.gitignore`]], `policy-apply`, `recovery`, `closed-hook`,
]);
assert.equal(success.target.session != null, true);
assert.equal(success.closeHandler, true);

const stale = harness({ isCurrentGeneration: () => false });
await startGitRepoWatchSession(stale.dependencies);
assert.equal(stale.events.includes(`trace`), false);

const backend = harness({ hasWorkingTreeHandler: false, startMetadataWatch: async () => { backendStarted = true; return { dispose: async () => {} }; } });
let backendStarted = false;
await startGitRepoWatchSession(backend.dependencies);
assert.equal(backendStarted, true);

const disposed = harness({ startWorkingTreeWatch: async () => { disposed.disposed = true; return { dispose: async () => disposed.events.push(`dispose`) }; } });
await startGitRepoWatchSession(disposed.dependencies);
assert.equal(disposed.events.includes(`attach`), false);
assert.equal(disposed.events.includes(`dispose`), true);

const failed = harness({ startWorkingTreeWatch: async () => { throw new Error(`backend-failed`); } });
await startGitRepoWatchSession(failed.dependencies);
assert.deepEqual(failed.events.slice(-3), [[`warning`, `backend-failed`], `recovery`, `retry`]);

const missing = harness({ stat: async () => { const error = new Error(`missing`); error.code = `ENOENT`; throw error; } });
missing.dependencies.recovering = true;
await startGitRepoWatchSession(missing.dependencies);
assert.equal(missing.target.metadataDirectory.missing, true);
assert.equal(missing.events.includes(`policy-read`), false);

console.log("18 worker GitRepoWatch session-runtime assertions passed");
