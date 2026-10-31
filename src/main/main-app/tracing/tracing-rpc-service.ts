// @ts-nocheck

/** Renderer RPC facade for trace export, sampling, and desktop trace-recording flow. */
export function createTracingRpcServiceClass(dependencies: Record<string, any>) {
  const {
    RpcHandlerBase,
    exportTraceBatch,
    setDesktopTracingSampleRate,
    confirmTraceRecordingStart,
    cancelTraceRecordingStart,
    keepTraceRecordingLocal,
    submitTraceRecording,
  } = dependencies;

  return class TracingRpcService extends RpcHandlerBase {
    setGitWorkerTracingSampleRate;
    saveDesktopTraceSampleRate;

    constructor(setGitWorkerTracingSampleRate: any, saveDesktopTraceSampleRate: any) {
      super();
      this.setGitWorkerTracingSampleRate = setGitWorkerTracingSampleRate;
      this.saveDesktopTraceSampleRate = saveDesktopTraceSampleRate;
    }

    async exportTraceBatch(batch: unknown) {
      await exportTraceBatch(batch);
    }

    async setSampleRate(value: number) {
      const sampleRate = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
      setDesktopTracingSampleRate(sampleRate);
      this.setGitWorkerTracingSampleRate(sampleRate);
      this.saveDesktopTraceSampleRate(sampleRate);
    }

    async confirmTraceRecordingStart() {
      return confirmTraceRecordingStart();
    }

    async cancelTraceRecordingStart() {
      return cancelTraceRecordingStart();
    }

    async submitTraceRecordingDetails(details: Record<string, any>) {
      return details.keepLocal
        ? keepTraceRecordingLocal()
        : submitTraceRecording({
            note: details.note,
            conversationId: details.conversationId,
          });
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createTracingRpcServiceClass };
}
