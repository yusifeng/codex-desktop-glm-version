export {};
import { classifyWorkerControlMessage } from "./entry-message-policy";

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
    const kind = classifyWorkerControlMessage(message, options.workerId, options.rpcClient.handleMessage(message));

    switch (kind) {
      case "sentry":
        options.onSentryUserUpdate(message);
        return;
      case "app":
        options.onAppEvent(message);
        return;
      case "flush":
        options.onFlushAndExit();
        return;
      case "turn":
        options.onGitTurnComplete(message);
        return;
      case "sample":
        options.onTracingSampleRateUpdate(message);
        return;
      case "analytics":
        options.onAnalyticsEnabledUpdate(message);
        return;
    }

    if (kind === "request") {
      options.onRequest(message.request);
      return;
    }
    if (kind === "cancel") {
      options.onCancel(message.id);
    }
  };
}

module.exports = { createWorkerMessageDispatcher };
