import { randomUUID } from "node:crypto";

export type WorkerRpcMethod =
  | "ces-telemetry"
  | "otel-export"
  | "computer-use-invalidate-service-pid"
  | "computer-use-service-pid"
  | "read-shortcut-link";

export interface WorkerRpcRequest {
  method: WorkerRpcMethod;
  params: unknown;
  signal?: AbortSignal;
}

export interface WorkerRpcPort {
  postMessage(message: unknown): void;
}

interface WorkerRpcResponse {
  type: "worker-main-rpc-response";
  workerId: string;
  requestId: string;
  method: WorkerRpcMethod;
  result: { type: "ok"; value: unknown } | { type: "error"; error: { code?: string; message: string } };
}

function isResponse(value: unknown): value is WorkerRpcResponse {
  if (value == null || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  const result = message.result;
  return message.type === "worker-main-rpc-response" && typeof message.workerId === "string" &&
    typeof message.requestId === "string" && typeof message.method === "string" &&
    result != null && typeof result === "object" && ((result as Record<string, unknown>).type === "ok" || (result as Record<string, unknown>).type === "error");
}

/** Typed counterpart of the worker xDe main-RPC client. */
class WorkerMainRpcClient {
  readonly workerId: string;
  readonly port: WorkerRpcPort;
  private readonly pending = new Map<string, { method: WorkerRpcMethod; resolve(value: unknown): void; reject(error: Error): void }>();

  constructor(workerId: string, port: WorkerRpcPort) { this.workerId = workerId; this.port = port; }

  request<T = unknown>({ method, params, signal }: WorkerRpcRequest): Promise<T> {
    if (signal?.aborted) return Promise.reject(new Error("Worker main RPC request aborted"));
    const requestId = randomUUID();
    const promise = new Promise<T>((resolve, reject) => this.pending.set(requestId, { method, resolve: resolve as (value: unknown) => void, reject }));
    const abort = () => {
      const request = this.pending.get(requestId); if (!request) return;
      this.pending.delete(requestId); request.reject(new Error("Worker main RPC request aborted"));
      try { this.port.postMessage({ type: "worker-main-rpc-cancel", workerId: this.workerId, requestId }); } catch { /* port may already be closed */ }
    };
    signal?.addEventListener("abort", abort, { once: true });
    try { this.port.postMessage({ type: "worker-main-rpc-request", workerId: this.workerId, requestId, method, params }); }
    catch (error) { this.pending.delete(requestId); signal?.removeEventListener("abort", abort); return Promise.reject(error instanceof Error ? error : new Error(String(error))); }
    return promise.finally(() => signal?.removeEventListener("abort", abort));
  }

  handleMessage(value: unknown): boolean {
    if (!isResponse(value) || value.workerId !== this.workerId) return false;
    const pending = this.pending.get(value.requestId); if (!pending) return true;
    this.pending.delete(value.requestId);
    if (pending.method !== value.method) { pending.reject(new Error("Mismatched main RPC response method")); return true; }
    if (value.result.type === "ok") pending.resolve(value.result.value);
    else pending.reject(Object.assign(new Error(value.result.error.message), value.result.error.code == null ? {} : { code: value.result.error.code }));
    return true;
  }

  dispose(): void { for (const pending of this.pending.values()) pending.reject(new Error("Worker main RPC client disposed")); this.pending.clear(); }
}

// worker.ts is a transform-only CommonJS chunk, so this boundary must remain
// require()-able after the TypeScript transform (without an ESM wrapper).
module.exports = { WorkerMainRpcClient };
