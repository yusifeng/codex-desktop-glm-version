/** Classify worker control messages before transport/request dispatch. */
export type WorkerControlMessageKind = "rpc" | "sentry" | "app" | "flush" | "turn" | "sample" | "analytics" | "request" | "cancel" | "unknown";
export function classifyWorkerControlMessage(message: any, workerId: string, rpcHandled = false): WorkerControlMessageKind {
  if (rpcHandled) return "rpc";
  switch (message?.type) {
    case "worker-sentry-user-update": return "sentry";
    case "worker-app-event": return "app";
    case "worker-flush-and-exit": return "flush";
    case "worker-git-turn-complete": return "turn";
    case "worker-tracing-sample-rate-update": return "sample";
    case "worker-analytics-enabled-update": return "analytics";
    case "worker-request": return message?.workerId === workerId ? "request" : "unknown";
    case "worker-request-cancel": return message?.workerId === workerId ? "cancel" : "unknown";
    default: return "unknown";
  }
}
if (typeof module !== "undefined") module.exports = { classifyWorkerControlMessage };
