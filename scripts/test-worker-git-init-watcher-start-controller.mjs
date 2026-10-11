import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { startGitInitWatcher } = require("../app/.vite/build/worker/git-init-watcher-start-controller.js");
let active = null; const calls = [];
const started = await startGitInitWatcher({ key: "repo", disposeActiveWatcher: () => calls.push("dispose-active"), createWatcher: () => ({ start: async () => true, dispose: () => calls.push("dispose") }), setActiveWatcher: (value) => { active = value; calls.push("set"); }, getActiveWatcher: () => active, clearActiveWatcher: () => { active = null; calls.push("clear"); } });
assert.equal(started, "started"); assert.deepEqual(calls, ["dispose-active", "set"]); assert.equal(active.key, "repo");
calls.length = 0; const failed = await startGitInitWatcher({ key: "failed", disposeActiveWatcher: () => {}, createWatcher: () => ({ start: async () => false, dispose: () => calls.push("dispose") }), setActiveWatcher: (value) => { active = value; }, getActiveWatcher: () => active, clearActiveWatcher: () => { active = null; calls.push("clear"); } }); assert.equal(failed, "failed"); assert.deepEqual(calls, ["clear", "dispose"]); assert.equal(active, null);
calls.length = 0; const supersededWatcher = { start: async () => false, dispose: () => calls.push("dispose") }; const superseded = await startGitInitWatcher({ key: "superseded", disposeActiveWatcher: () => {}, createWatcher: () => supersededWatcher, setActiveWatcher: () => {}, getActiveWatcher: () => ({ key: "other", watcher: {} }), clearActiveWatcher: () => calls.push("unexpected-clear") }); assert.equal(superseded, "superseded"); assert.deepEqual(calls, ["dispose"]); console.log("7 worker Git init watcher-start controller assertions passed");
