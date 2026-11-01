import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { transform } from "esbuild";

const collectorSource = fs.readFileSync(
  new URL("../src/main/main-app/startup/electron-performance-snapshot-collector.ts", import.meta.url),
  "utf8",
);
const collectorOutput = await transform(collectorSource, { loader: "ts", format: "cjs", target: "es2022" });
const collectorModule = { exports: {} };
Function("module", "exports", collectorOutput.code)(collectorModule, collectorModule.exports);
const { createElectronPerformanceSnapshotCollectorClass } = collectorModule.exports;

const calls = [];
const memoryUsage = () => ({
  rss: 1000,
  heapTotal: 800,
  heapUsed: 600,
  external: 40,
  arrayBuffers: 20,
});
memoryUsage.rss = () => 1000;
const processApi = { pid: 1, platform: "linux", memoryUsage };
const current = { id: 10, getOSProcessId: () => 2, isDestroyed: () => false };
const shared = { id: 11, getOSProcessId: () => 2, isDestroyed: () => false };
const other = { id: 12, getOSProcessId: () => 3, isDestroyed: () => false };
let appMetrics = [
  { pid: 1, type: "Browser", cpu: { percentCPUUsage: 4, cumulativeCPUUsage: 2 }, memory: { workingSetSize: 50 } },
  { pid: 2, type: "Tab", creationTime: 123, cpu: { percentCPUUsage: 7, cumulativeCPUUsage: 3 }, memory: { workingSetSize: 100, peakWorkingSetSize: 120, privateBytes: 80, sharedBytes: 20 } },
  { pid: 3, type: "Tab", cpu: { cumulativeCPUUsage: 1 }, memory: { workingSetSize: 200, peakWorkingSetSize: 240 } },
];
const electron = {
  app: { getAppMetrics: () => appMetrics },
  webContents: { getAllWebContents: () => [current, shared, other] },
  BrowserWindow: { fromWebContents: (value) => value === shared ? {} : null },
};
let descendants = [
  { pid: 20, rootChildPid: 20, depth: 1, kind: "git", command: "/usr/bin/git status", rssKb: 10, ageSeconds: 4 },
  { pid: 21, rootChildPid: 20, depth: 2, kind: "git", command: "/usr/bin/git fetch", rssKb: 5, ageSeconds: 2 },
  { pid: 30, rootChildPid: 30, depth: 1, kind: "app_server", command: "'/opt/Codex App/app-server'", rssKb: 20, ageSeconds: 3 },
];
function summarize(processes) {
  const byKind = [];
  for (const kind of ["app_server", "git"]) {
    const matches = processes.filter((entry) => entry.kind === kind);
    byKind.push({
      kind,
      count: matches.length,
      rssKb: matches.reduce((sum, entry) => sum + (entry.rssKb ?? 0), 0),
      directCount: matches.filter((entry) => entry.depth === 1).length,
      directRssKb: matches.filter((entry) => entry.depth === 1).reduce((sum, entry) => sum + (entry.rssKb ?? 0), 0),
    });
  }
  return {
    totalCount: processes.length,
    totalRssKb: processes.reduce((sum, entry) => sum + (entry.rssKb ?? 0), 0),
    directCount: processes.filter((entry) => entry.depth === 1).length,
    directRssKb: processes.filter((entry) => entry.depth === 1).reduce((sum, entry) => sum + (entry.rssKb ?? 0), 0),
    oldestAgeSeconds: 4,
    byKind,
  };
}
const systemMetrics = {
  mainProcessHandleCount: 9,
  systemTotalMemoryBytes: 10_000,
  systemFreeMemoryBytes: 4_000,
  systemCommitTotalBytes: 5_000,
  systemCommitLimitBytes: 8_000,
  systemKernelPagedPoolBytes: 100,
  systemKernelNonpagedPoolBytes: 200,
  systemHandleCount: 30,
  systemProcessCount: 4,
  systemThreadCount: 40,
  systemUptimeMs: 50_000,
};
let monotonicNow = 700;
const Collector = createElectronPerformanceSnapshotCollectorClass({
  basename: path.basename,
  createLogger: () => ({ warning: (...args) => calls.push(["warning", ...args]) }),
  desktopSnapshot: () => ({ desktop_field: 1 }),
  electron,
  freeMemory: () => 123,
  getSystemMetrics: () => systemMetrics,
  isInternalBuild: (flavor) => flavor === "internal",
  listDescendantProcesses: async (pid) => {
    assert.equal(pid, 1);
    return descendants;
  },
  now: () => monotonicNow,
  processApi,
  summarizeDescendantProcesses: summarize,
});
const collector = new Collector(
  "internal",
  { getSnapshot: () => ({ totalInvocations: 12, invocationsLast30s: 3 }) },
  (value) => value === current,
);

const first = await collector.collectSnapshotFields(current);
assert.equal(first.desktop_field, 1);
assert.equal(first.main_process_cpu_percent, 4);
assert.equal(first.renderer_process_cpu_percent, 7);
assert.equal(first.renderer_process_count_total, 2);
assert.equal(first.renderer_webcontents_count_total, 3);
assert.equal(first.renderer_process_working_set_kb_total, 300);
assert.equal(first.renderer_process_rank_1_kind, "other");
assert.equal(first.renderer_process_rank_2_kind, "mixed");
assert.equal(first.git_worker_invocations_total, 12);
assert.equal(first.host_descendant_process_count_total, 3);
assert.equal(first.host_child_git_process_count, 2);
assert.equal(first.host_child_app_server_process_count, 1);
assert.equal(first.host_descendant_process_command_1, "app-server");
assert.equal(first.host_descendant_process_command_2, "git");
assert.equal(first.host_descendant_root_1_kind, "app_server");
assert.equal(first.host_descendant_root_1_command_name, "app-server");

appMetrics = appMetrics.map((metric) =>
  metric.pid === 3 ? { ...metric, memory: { ...metric.memory, workingSetSize: 250 } } : metric,
);
descendants = descendants.slice(0, 2);
const second = await collector.collectSnapshotFields(current);
assert.equal(second.renderer_process_working_set_kb_delta_since_last_snapshot, 50);
assert.equal(second.host_descendant_process_count_delta_since_last_snapshot, -1);
assert.equal(second.host_descendant_process_rss_kb_delta_since_last_snapshot, -20);

const initialCpu = collector.collectPerformanceSpanCpuSnapshot(current);
assert.equal(initialCpu.capturedAtMonotonicMs, 700);
assert.equal(initialCpu.mainProcessCumulativeCpuSeconds, 2);
assert.equal(initialCpu.rendererProcessCumulativeCpuSeconds, 3);
assert.equal(initialCpu.rendererProcessCount, 2);
assert.equal(initialCpu.rendererProcessWorkingSetKbTotal, 350);
assert.equal(initialCpu.systemTotalMemoryBytes, undefined);
monotonicNow = 900;
const finalCpu = collector.collectPerformanceSpanCpuSnapshot(current, "final");
assert.equal(finalCpu.capturedAtMonotonicMs, 900);
assert.equal(finalCpu.systemTotalMemoryBytes, 10_000);

assert.equal(collector.getRendererProcessKind([current]), "iab");
assert.equal(collector.getRendererProcessKind([shared]), "main_window");
assert.equal(collector.getRendererProcessKind([other]), "other");
assert.equal(collector.getRendererProcessKind([current, shared]), "mixed");

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(main, /uQe = createElectronPerformanceSnapshotCollectorClass\(\{/);
assert.doesNotMatch(main, /uQe = class/);
assert.doesNotMatch(main, /function (?:jZ|fQe|pQe|MZ)\(/);

console.log("electron performance snapshot collector assertions: 35");
