import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { disposeGitRepoWatcher } = require("../app/.vite/build/worker/git-repo-watcher-dispose-controller.js");

const events = [];
let stored = null;
const dependencies = {
  getDisposePromise: () => stored,
  setDisposePromise: (promise) => { stored = promise; events.push("promise"); },
  markDisposed: () => events.push("disposed"),
  disposeIgnorePolicy: () => { events.push("ignore"); return Promise.resolve(); },
  disposeSessions: () => { events.push("sessions"); return [Promise.resolve()]; },
  clearWatchTargets: () => events.push("targets"),
  disposeControllers: () => events.push("controllers"),
  clearIgnoreSourceWatches: () => events.push("ignore-watches"),
  clearChangedIgnoreSourcePaths: () => events.push("changed-ignore"),
  pendingMetadataRefresh: () => { events.push("metadata"); return Promise.resolve(); },
};
const first = disposeGitRepoWatcher(dependencies);
assert.deepEqual(events, ["disposed", "ignore", "sessions", "targets", "controllers", "ignore-watches", "changed-ignore", "metadata", "promise"]);
assert.equal(disposeGitRepoWatcher(dependencies), first);
assert.deepEqual(events, ["disposed", "ignore", "sessions", "targets", "controllers", "ignore-watches", "changed-ignore", "metadata", "promise"]);
await first;
console.log("10 worker GitRepoWatcher dispose-controller assertions passed");
