// @ts-nocheck

/** Reads the realtime memory summary from an execution host's Codex home. */
export function createRealtimeMemorySummaryClass(
  dependencies: Record<string, any>,
) {
  const { RpcHandlerBase, readRemoteFile } = dependencies;

  return class RealtimeMemorySummary extends RpcHandlerBase {
    executionHost;

    constructor(executionHost: any) {
      super();
      this.executionHost = executionHost;
    }

    async readSummary() {
      const [codexHome, platformPath] = await Promise.all([
        this.executionHost.codexHome(),
        this.executionHost.platformPath(),
      ]);
      try {
        const summary = await readRemoteFile(
          platformPath.join(codexHome, "memories", "memory_summary.md"),
          this.executionHost,
        );
        return summary.trim() ? summary : null;
      } catch {
        return null;
      }
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createRealtimeMemorySummaryClass };
