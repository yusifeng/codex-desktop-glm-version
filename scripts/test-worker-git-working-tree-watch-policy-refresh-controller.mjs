import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { refreshGitWorkingTreeWatchPolicy } = require("../app/.vite/build/worker/git-working-tree-watch-policy-refresh-controller.js");

const events = [];
const policy = { current: true };
const target = { retry: false, session: {} };
const deps = (action, overrides = {}) => ({
  getPolicy: () => policy, getTarget: () => target, awaitSessionStart: async () => events.push("await"),
  isDisposed: () => false, hasRetryTimer: () => target.retry, readPolicy: async () => ({ directories: ["next"] }),
  isCurrent: () => true, getAction: () => action, applyPolicy: () => { events.push("apply"); return true; },
  onApplied: () => events.push("event"), disposeSession: async () => events.push("dispose"),
  startSession: async () => events.push("start"), getPreviousDirectories: () => ["old"], setPreviousDirectories: () => {},
  hasSession: () => target.session != null, ...overrides,
});
await refreshGitWorkingTreeWatchPolicy(deps("apply")); assert.deepEqual(events, ["await", "await", "apply", "event"]);
events.length = 0; await refreshGitWorkingTreeWatchPolicy(deps("skip")); assert.deepEqual(events, ["await", "await"]);
events.length = 0; await refreshGitWorkingTreeWatchPolicy(deps("restart")); assert.deepEqual(events, ["await", "await", "dispose", "start"]);
events.length = 0; target.retry = true; await refreshGitWorkingTreeWatchPolicy(deps("restart")); assert.deepEqual(events, ["await"]); target.retry = false;
console.log("10 worker working-tree watch policy refresh assertions passed");
