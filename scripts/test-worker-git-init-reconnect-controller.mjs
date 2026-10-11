import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createGitInitReconnectController } = require("../app/.vite/build/worker/git-init-reconnect-controller.js");

const timers = new Map(); const events = []; let nextId = 0; let disposed = false; let starts = 0;
const controller = createGitInitReconnectController({ isDisposed: () => disposed, initialDelayMs: 10, maxDelayMs: 40,
  nextDelay: (delay, max) => Math.min(max, delay * 2), setTimeout: (callback, delay) => { const id = ++nextId; timers.set(id, { callback, delay }); return id; },
  clearTimeout: (id) => { events.push(`clear:${id}`); timers.delete(id); }, startSessions: async () => { starts += 1; events.push("start"); return starts > 1; } });
controller.schedule(".git", "/"); controller.schedule(".git", "/"); assert.deepEqual([...timers.values()].map((timer) => timer.delay), [10]);
const first = [...timers.values()][0]; timers.clear(); await first.callback(); assert.equal(starts, 1); assert.deepEqual([...timers.values()].map((timer) => timer.delay), [20]);
const second = [...timers.values()][0]; timers.clear(); await second.callback(); assert.equal(starts, 2);
controller.schedule(".git", "/"); controller.dispose(); assert.deepEqual(events.slice(-1), ["clear:3"]); disposed = true; controller.schedule(".git", "/"); assert.equal(timers.size, 0);
console.log("8 worker Git init reconnect-controller assertions passed");
