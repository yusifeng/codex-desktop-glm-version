import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { emitGitRepoChange } = require("../app/.vite/build/worker/git-repo-change-emission-controller.js");

function harness(overrides = {}) {
  const events = [];
  let pendingPaths = new Set([`/repo/a`, `/repo/b`]);
  let headKnown = true;
  let headState = null;
  const dependencies = {
    changeType: `working-tree`,
    consumeRawEventCount: (type) => { events.push([`consume`, type]); return 4; },
    getPendingWorkingTreePaths: () => pendingPaths,
    resetPendingWorkingTreePaths: () => { pendingPaths = new Set(); events.push(`reset-paths`); },
    getOperationState: async () => { events.push(`operation-state`); return { mergeInProgress: false, rebaseInProgress: true }; },
    isDisposed: () => false,
    createEvent: (input) => { events.push([`create-event`, input]); return { type: `git-repo-changed`, ...input }; },
    commonDir: `/repo/.git`,
    hostId: `host-1`,
    root: `/repo`,
    onCoalescedChange: (input) => events.push([`coalesced`, input]),
    emit: async (event) => events.push([`emit`, event]),
    isHeadRefKnown: () => headKnown,
    getCurrentBranchState: async () => { events.push(`branch-state`); return { type: `branch`, branch: `feature/test` }; },
    resolveHeadRefPath: (branch) => `/repo/.git/refs/heads/${branch}`,
    setHeadRefState: (path, known) => { headState = { path, known }; events.push([`head-state`, path, known]); },
    logRepoChanged: (...args) => events.push([`log`, ...args]),
    complete: (type) => events.push([`complete`, type]),
    ...overrides,
  };
  return {
    dependencies,
    events,
    get headState() { return headState; },
    set headKnown(value) { headKnown = value; },
    get pendingPaths() { return pendingPaths; },
  };
}

const workingTree = harness();
await emitGitRepoChange(workingTree.dependencies);
assert.deepEqual(workingTree.events[0], [`consume`, `working-tree`]);
assert.equal(workingTree.events[1], `reset-paths`);
assert.deepEqual([...workingTree.pendingPaths], []);
const payload = workingTree.events.find(([kind]) => kind === `create-event`)[1];
assert.deepEqual(payload.changedPaths, [`/repo/a`, `/repo/b`]);
assert.equal(payload.rebaseInProgress, true);
assert.deepEqual(workingTree.events.at(-1), [`complete`, `working-tree`]);
assert.equal(workingTree.events.some((event) => event[0] === `log`), true);

const head = harness({ changeType: `head` });
head.headKnown = false;
await emitGitRepoChange(head.dependencies);
assert.equal(head.events.includes(`reset-paths`), false);
assert.deepEqual(head.headState, { path: `/repo/.git/refs/heads/feature/test`, known: true });
assert.ok(head.events.indexOf(`branch-state`) > head.events.findIndex((event) => event[0] === `emit`));
assert.deepEqual(head.events.at(-1), [`complete`, `head`]);

const unknown = harness({
  changeType: `head`,
  isHeadRefKnown: () => false,
  getCurrentBranchState: async () => ({ type: `unknown` }),
});
await emitGitRepoChange(unknown.dependencies);
assert.deepEqual(unknown.headState, { path: null, known: false });

const disposed = harness({ isDisposed: () => true });
await emitGitRepoChange(disposed.dependencies);
assert.equal(disposed.events.some((event) => event[0] === `create-event`), false);
assert.deepEqual(disposed.events.at(-1), [`complete`, `working-tree`]);

const failed = harness({ emit: async () => { throw new Error(`emit-failed`); } });
await assert.rejects(() => emitGitRepoChange(failed.dependencies), /emit-failed/);
assert.equal(failed.events.some((event) => event[0] === `log`), false);
assert.deepEqual(failed.events.at(-1), [`complete`, `working-tree`]);

const stateFailure = harness({ getOperationState: async () => { throw new Error(`state-failed`); } });
await assert.rejects(() => emitGitRepoChange(stateFailure.dependencies), /state-failed/);
assert.deepEqual(stateFailure.events.at(-1), [`complete`, `working-tree`]);

console.log("19 worker Git repo-change emission assertions passed");
