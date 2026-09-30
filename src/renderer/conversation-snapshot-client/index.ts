// Conversation snapshot SharedWorker client. Release chunk: client-206f71f5a32c.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface Metrics {
  count(namespace: string, metric: string, tags: Record<string, unknown>): void;
  hist(
    namespace: string,
    metric: string,
    tags: Record<string, unknown>,
    value: number,
  ): void;
}
interface Scope {
  get(key: unknown): Metrics | undefined;
}
interface Snapshot {
  conversation_id: string;
  [key: string]: unknown;
}
type ReadResult =
  | {
      status: "hit";
      byteLength: number;
      decodeDurationMs: number;
      [key: string]: unknown;
    }
  | { status: "miss"; reason: string; [key: string]: unknown };
type WriteResult =
  | { status: "written"; byteLength: number; encodeDurationMs: number }
  | { status: "rejected"; reason: string };
interface RpcClient {
  request(
    request: Record<string, unknown>,
    transfer?: unknown,
  ): Promise<unknown>;
  [Symbol.dispose](): void;
}
interface SharedRuntime {
  DI(port: MessagePort): RpcClient;
  EI(): void;
}
interface InitialRuntime {
  GHt: unknown;
  KHt(): void;
  UHt: string;
  WHt: string;
  eJt: unknown;
  nJt: Metrics;
  tJt(): void;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;

function metricsFor(scope?: Scope): Metrics {
  return scope?.get(initial.eJt) ?? initial.nJt;
}

function createConversationSnapshotClient(
  scope?: Scope,
  activationScope?: unknown,
  onInvalidated?: (artifactId: string) => void,
) {
  if (activationScope != null) {
    localStorage.setItem(initial.WHt, "1");
    if (
      localStorage.getItem("codex.conversation_snapshot_cache.persisted") !==
      "1"
    ) {
      throw new Error("conversation_snapshot_persistence_marker_unavailable");
    }
  }
  const worker = new SharedWorker(
    new URL(
      new URL("worker-3fe306248590.js", import.meta.url).href,
      import.meta.url,
    ),
    { type: "module" },
  );
  const rpc = shared.DI(worker.port);
  worker.addEventListener("error", () => rpc[Symbol.dispose](), { once: true });

  async function perform(
    operation: string,
    request: Record<string, unknown>,
    suppliedSignal?: AbortSignal,
  ): Promise<unknown> {
    const metrics = metricsFor(scope);
    const startedAt = performance.now();
    const signal =
      suppliedSignal ??
      AbortSignal.timeout(
        operation === "write" || operation === "clear" ? 2_000 : 1_000,
      );
    let abortListener: (() => void) | undefined;
    try {
      signal.throwIfAborted();
      const response = rpc.request(
        request,
        request.type === "activateScope" ? onInvalidated : undefined,
      );
      const result = await Promise.race([
        response,
        new Promise<never>((_resolve, reject) => {
          abortListener = () =>
            reject(
              new DOMException(
                "Conversation snapshot operation aborted",
                "AbortError",
              ),
            );
          signal.addEventListener("abort", abortListener, { once: true });
        }),
      ]);
      if (operation !== "read" && operation !== "write") {
        metrics.count("default", "conversation_snapshot_cache", {
          operation,
          result: "ok",
        });
      }
      metrics.hist(
        "default",
        `conversation_snapshot_cache.${operation}_ms`,
        {},
        performance.now() - startedAt,
      );
      return result;
    } catch (error) {
      if (suppliedSignal?.aborted) {
        metrics.hist(
          "default",
          "conversation_snapshot_cache.cancelled_ms",
          {
            operation,
            reason:
              suppliedSignal.reason === "server_won"
                ? "server_won"
                : "cancelled",
          },
          performance.now() - startedAt,
        );
      } else if (operation !== "read" && operation !== "write") {
        metrics.count("default", "conversation_snapshot_cache", {
          operation,
          result: "error",
        });
      }
      throw error;
    } finally {
      if (abortListener != null)
        signal.removeEventListener("abort", abortListener);
    }
  }

  if (activationScope != null) {
    void perform("activate", {
      type: "activateScope",
      scope: activationScope,
      limits: initial.GHt,
    }).catch(() => undefined);
  }

  return {
    async read(
      artifactId: string,
      includePayload: boolean,
      signal?: AbortSignal,
    ): Promise<ReadResult> {
      const metrics = metricsFor(scope);
      const response = (await perform(
        "read",
        {
          type: "readSnapshot",
          artifactId,
          includePayload,
        },
        signal,
      ).catch(() => undefined)) as Partial<ReadResult> | undefined;
      const result: ReadResult =
        response?.status === "hit" || response?.status === "miss"
          ? (response as ReadResult)
          : { status: "miss", reason: "worker_failure" };
      if (result.status === "miss" && signal?.aborted) {
        result.reason =
          signal.reason === "server_won" ? "server_won" : "cancelled";
      }
      metrics.count("default", "conversation_snapshot_cache", {
        operation: "read",
        result: result.status,
        ...(result.status === "miss" ? { reason: result.reason } : {}),
      });
      if (result.status === "hit") {
        metrics.hist(
          "default",
          "conversation_snapshot_cache.read_bytes",
          {},
          result.byteLength,
        );
        metrics.hist(
          "default",
          "conversation_snapshot_cache.decode_ms",
          {},
          result.decodeDurationMs,
        );
      }
      return result;
    },
    async write(
      snapshot: Snapshot,
      requestStartedAt: number,
    ): Promise<WriteResult> {
      const response = (await perform("write", {
        type: "writeSnapshot",
        artifactId: snapshot.conversation_id,
        payload: snapshot,
        requestStartedAt,
      }).catch(() => undefined)) as Partial<WriteResult> | undefined;
      const result: WriteResult =
        response?.status === "written" || response?.status === "rejected"
          ? (response as WriteResult)
          : { status: "rejected", reason: "worker_failure" };
      const metrics = metricsFor(scope);
      metrics.count("default", "conversation_snapshot_cache", {
        operation: "write",
        result: result.status,
        ...(result.status === "rejected" ? { reason: result.reason } : {}),
      });
      if (result.status === "written") {
        localStorage.setItem(initial.WHt, "1");
        metrics.hist(
          "default",
          "conversation_snapshot_cache.write_bytes",
          {},
          result.byteLength,
        );
        metrics.hist(
          "default",
          "conversation_snapshot_cache.encode_ms",
          {},
          result.encodeDurationMs,
        );
      }
      return result;
    },
    async delete(artifactId: string): Promise<void> {
      const result = (await perform("delete", {
        type: "deleteSnapshot",
        artifactId,
      })) as { status?: string } | undefined;
      if (result?.status === "rejected") {
        throw new Error("conversation_snapshot_delete_failed");
      }
    },
    async clear(): Promise<void> {
      try {
        const result = (await perform("clear", { type: "clearDatabase" })) as
          { status?: string } | undefined;
        if (result?.status !== "rejected") localStorage.removeItem(initial.WHt);
      } finally {
        rpc[Symbol.dispose]();
        worker.port.close();
      }
    },
  };
}

async function clearPersistedConversationSnapshots(): Promise<void> {
  if (typeof SharedWorker !== "undefined") {
    return createConversationSnapshotClient().clear();
  }
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(initial.UHt);
    request.onsuccess = () => {
      localStorage.removeItem(initial.WHt);
      resolve();
    };
    request.onerror = () =>
      reject(
        request.error ?? new Error("conversation_snapshot_cleanup_failed"),
      );
    request.onblocked = () =>
      reject(new Error("conversation_snapshot_cleanup_failed"));
  });
}

shared.EI();
initial.tJt();
initial.KHt();

export {
  clearPersistedConversationSnapshots,
  createConversationSnapshotClient,
};
