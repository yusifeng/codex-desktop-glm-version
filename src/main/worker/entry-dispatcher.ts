export {};

interface WorkerEntryDispatcherOptions {
  workerId: string;
  rpcClient: { handleMessage(message: unknown): boolean };
  onSentryUserUpdate(message: any): void;
  onAppEvent(message: any): void;
  onFlushAndExit(): void;
  onGitTurnComplete(message: any): void;
  onTracingSampleRateUpdate(message: any): void;
  onAnalyticsEnabledUpdate(message: any): void;
  onRequest(request: any): void;
  onCancel(id: string): void;
}

/**
 * Worker protocol boundary. The parentPort binding stays in worker.ts, while
 * message classification and lifecycle dispatch live in a testable module.
 */
function createWorkerMessageDispatcher(options: WorkerEntryDispatcherOptions) {
  return (message: any): void => {
    if (options.rpcClient.handleMessage(message)) return;

    switch (message?.type) {
      case "worker-sentry-user-update":
        options.onSentryUserUpdate(message);
        return;
      case "worker-app-event":
        options.onAppEvent(message);
        return;
      case "worker-flush-and-exit":
        options.onFlushAndExit();
        return;
      case "worker-git-turn-complete":
        options.onGitTurnComplete(message);
        return;
      case "worker-tracing-sample-rate-update":
        options.onTracingSampleRateUpdate(message);
        return;
      case "worker-analytics-enabled-update":
        options.onAnalyticsEnabledUpdate(message);
        return;
    }

    if (message?.workerId !== options.workerId) return;
    if (message.type === "worker-request") {
      options.onRequest(message.request);
      return;
    }
    if (message.type === "worker-request-cancel") {
      options.onCancel(message.id);
    }
  };
}

module.exports = { createWorkerMessageDispatcher };
