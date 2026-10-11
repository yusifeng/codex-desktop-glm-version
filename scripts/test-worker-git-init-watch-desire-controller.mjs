import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { ensureGitInitWatchDesired } = require("../app/.vite/build/worker/git-init-watch-desire-controller.js");
let desired = "old"; const calls = [];
await ensureGitInitWatchDesired({ key: "new", getDesiredWatchKey: () => desired, setDesiredWatchKey: (key) => { desired = key; calls.push(["desired", key]); }, disposeWatcher: () => calls.push("dispose"), startWatcher: async () => { calls.push("start"); return "started"; } });
assert.deepEqual(calls, ["dispose", ["desired", "new"], "start"]); assert.equal(desired, "new");
calls.length = 0; await ensureGitInitWatchDesired({ key: "new", getDesiredWatchKey: () => desired, setDesiredWatchKey: () => calls.push("unexpected"), disposeWatcher: () => calls.push("unexpected"), startWatcher: async () => { calls.push("unexpected"); return "started"; } }); assert.deepEqual(calls, []);
calls.length = 0; await ensureGitInitWatchDesired({ key: "retry", getDesiredWatchKey: () => desired, setDesiredWatchKey: (key) => { desired = key; calls.push(["desired", key]); }, disposeWatcher: () => calls.push("dispose"), startWatcher: async () => { calls.push("start"); return "failed"; } }); assert.deepEqual(calls, ["dispose", ["desired", "retry"], "start", ["desired", null]]); assert.equal(desired, null); console.log("6 worker Git init watch-desire controller assertions passed");
