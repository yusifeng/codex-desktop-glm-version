// @ts-nocheck

/** Creates the cached process/RSS snapshot owner used by the main runtime service. */
export function createProcessMemorySnapshotCacheClass(dependencies: Record<string, any>) {
  const { RpcHandlerBase, listChildProcesses, processRef, cacheDurationMs } = dependencies;

  return class ProcessMemorySnapshotCache extends RpcHandlerBase {
    snapshot = null;
    snapshotExpiresAtMs = 0;
    snapshotPromise = null;

    async getSnapshot() {
      const { childProcesses, ...summary } = await this.getChildProcessesSnapshot();
      return summary;
    }

    async getChildProcessesSnapshot() {
      if (this.snapshot != null && Date.now() < this.snapshotExpiresAtMs) return this.snapshot;
      if (this.snapshotPromise != null) return this.snapshotPromise;
      const pendingSnapshot = this.createSnapshot();
      this.snapshotPromise = pendingSnapshot;
      try {
        this.snapshot = await pendingSnapshot;
        this.snapshotExpiresAtMs = Date.now() + cacheDurationMs;
        return this.snapshot;
      } finally {
        if (this.snapshotPromise === pendingSnapshot) this.snapshotPromise = null;
      }
    }

    async createSnapshot() {
      const childProcesses = await listChildProcesses(processRef.pid);
      const processesByPid = new Map(childProcesses.map((child) => [child.pid, child]));
      const mainProcess = {
        ageSeconds: Math.floor(processRef.uptime()),
        command: processRef.argv.map((argument) => JSON.stringify(argument)).join(" "),
        cpuPercent: null,
        pid: processRef.pid,
        rssKb: Math.floor(processRef.memoryUsage().rss / 1024),
      };
      let appServerRssKb = 0;
      let codexAppRssKb = mainProcess.rssKb;
      let otherChildProcessesRssKb = 0;
      let rolloutChildProcessesRssKb = 0;
      for (const child of childProcesses) {
        const rssKb = child.rssKb ?? 0;
        if (child.kind === "app_server") appServerRssKb += rssKb;
        else if (hasAppServerAncestor(child, processesByPid)) rolloutChildProcessesRssKb += rssKb;
        else if (child.kind.startsWith("electron_")) codexAppRssKb += rssKb;
        else otherChildProcessesRssKb += rssKb;
      }
      return {
        appServerRssKb,
        childProcesses,
        codexAppRssKb,
        mainProcess,
        otherChildProcessesRssKb,
        processCount: childProcesses.length + 1,
        rolloutChildProcessesRssKb,
        totalRssKb:
          appServerRssKb + codexAppRssKb + otherChildProcessesRssKb + rolloutChildProcessesRssKb,
      };
    }
  };
}

function hasAppServerAncestor(process: any, processesByPid: Map<number, any>) {
  let parent = processesByPid.get(process.parentPid);
  while (parent != null) {
    if (parent.kind === "app_server") return true;
    parent = processesByPid.get(parent.parentPid);
  }
  return false;
}

if (typeof module !== "undefined")
  module.exports = { createProcessMemorySnapshotCacheClass };
