import assert from "node:assert/strict";
import fs from "node:fs";
import { createProcessMemorySnapshotCacheClass } from "../src/main/main-app/startup/process-memory-snapshot-cache.ts";

const children = [
  { pid: 2, parentPid: 1, kind: "app_server", rssKb: 100 },
  { pid: 3, parentPid: 2, kind: "rollout", rssKb: 20 },
  { pid: 4, parentPid: 3, kind: "tool", rssKb: 5 },
  { pid: 5, parentPid: 1, kind: "electron_renderer", rssKb: 30 },
  { pid: 6, parentPid: 1, kind: "helper", rssKb: 10 },
  { pid: 7, parentPid: 1, kind: "helper", rssKb: null },
];
let calls = 0;
const SnapshotCache = createProcessMemorySnapshotCacheClass({
  RpcHandlerBase: class {},
  listChildProcesses: async (pid) => { calls++; assert.equal(pid, 1); return children; },
  processRef: {
    pid: 1,
    argv: ["codex", "--flag", "two words"],
    uptime: () => 12.9,
    memoryUsage: () => ({ rss: 102_400 }),
  },
  cacheDurationMs: 5_000,
});

const cache = new SnapshotCache();
const full = await cache.getChildProcessesSnapshot();
assert.equal(full.appServerRssKb, 100);
assert.equal(full.rolloutChildProcessesRssKb, 25);
assert.equal(full.codexAppRssKb, 130);
assert.equal(full.otherChildProcessesRssKb, 10);
assert.equal(full.totalRssKb, 265);
assert.equal(full.processCount, 7);
assert.equal(full.mainProcess.ageSeconds, 12);
assert.equal(full.mainProcess.command, '"codex" "--flag" "two words"');
assert.equal(full.mainProcess.rssKb, 100);
assert.equal(full.childProcesses, children);

const cached = await cache.getChildProcessesSnapshot();
assert.equal(cached, full);
assert.equal(calls, 1);
const summary = await cache.getSnapshot();
assert.equal("childProcesses" in summary, false);
assert.equal(summary.totalRssKb, 265);

cache.snapshotExpiresAtMs = 0;
assert.notEqual(await cache.getChildProcessesSnapshot(), full);
assert.equal(calls, 2);

const deferred = Promise.withResolvers();
let pendingCalls = 0;
const SingleFlightCache = createProcessMemorySnapshotCacheClass({
  RpcHandlerBase: class {},
  listChildProcesses: async () => { pendingCalls++; return deferred.promise; },
  processRef: { pid: 1, argv: [], uptime: () => 0, memoryUsage: () => ({ rss: 0 }) },
  cacheDurationMs: 5_000,
});
const singleFlight = new SingleFlightCache();
const first = singleFlight.getChildProcessesSnapshot();
const second = singleFlight.getChildProcessesSnapshot();
assert.equal(pendingCalls, 1);
deferred.resolve([]);
assert.deepEqual(await first, await second);
assert.equal(singleFlight.snapshotPromise, null);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /z6e = createProcessMemorySnapshotCacheClass\(\{/);
assert.doesNotMatch(main, /z6e = class/);
assert.doesNotMatch(main, /function B6e\(/);

console.log("process memory snapshot cache assertions: 22");
