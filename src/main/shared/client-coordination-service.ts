import { Uf as RpcTarget } from "@chunk/shared";

const DEFAULT_TIMEOUT_MS = 5_000;
const COMPLETE_HISTORY_TIMEOUT_MS = 300_000;
const UNTRUSTED_INPUT_ERROR = "App input requires confirmation before legacy delivery";
const ownedThreadsByClient = new WeakMap<object, Set<string>>();

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined, timedOut = false;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { timedOut = true; reject(new Error(message)); }, timeoutMs);
  });
  try { return await Promise.race([promise, timeout]); }
  finally { if (timer != null) clearTimeout(timer); if (timedOut) (promise as any)[Symbol.dispose]?.(); }
}

async function copyAndDispose<T extends Record<string, any>>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  const result = await withTimeout(promise, timeoutMs, message);
  try { const copy = { ...result } as any; delete copy[Symbol.dispose]; return copy as T; }
  finally { (result as any)[Symbol.dispose]?.(); }
}

/** RPC-visible host/client coordination service (original `tce`). */
export class ClientCoordinationService extends RpcTarget {
  private readonly ownedThreads = new Set<string>();
  private readStateBroadcast = Promise.resolve();

  constructor(
    private readonly ipcClient: any,
    private readonly getThreadReadStateContext: (hostId: string) => unknown | Promise<unknown>,
    private readonly ownerDiscoveryTimeoutMs = DEFAULT_TIMEOUT_MS,
  ) {
    super();
    ownedThreadsByClient.set(ipcClient, this.ownedThreads);
  }

  ownsThread(hostId: string, conversationId: string): boolean { return this.ownedThreads.has(`${hostId}:${conversationId}`); }
  async setThreadOwnership({ hostId, conversationId, ownsThread }: any): Promise<void> {
    const key = `${hostId}:${conversationId}`;
    ownsThread ? this.ownedThreads.add(key) : this.ownedThreads.delete(key);
  }
  async threadArchived(params: any): Promise<void> { await this.broadcast("thread-archived", params); }
  async threadUnarchived(params: any): Promise<void> { await this.broadcast("thread-unarchived", params); }
  async threadQueuedFollowUpsChanged(params: any): Promise<void> { await this.broadcast("thread-queued-followups-changed", params); }
  async threadStreamStateChanged({ params, targetClientIds }: any): Promise<void> { await this.broadcast("thread-stream-state-changed", params, { targetClientIds }); }
  async threadStreamFollowingChanged({ params, targetClientIds }: any): Promise<void> { await this.broadcast("thread-stream-following-changed", params, { targetClientIds }); }
  async threadStreamFollowingStatusRequested(params: any): Promise<void> { await this.broadcast("thread-stream-following-status-requested", params); }
  threadReadStateChanged(params: any): Promise<void> {
    const prerequisites = Promise.allSettled([
      this.getThreadReadStateContext(params.hostId),
      this.ipcClient.waitUntilInitialized({ timeoutMs: DEFAULT_TIMEOUT_MS }),
    ]);
    const operation = this.readStateBroadcast.then(async () => {
      const [context, initialized] = await prerequisites;
      if (context.status === "rejected") throw context.reason;
      if (initialized.status === "rejected") throw initialized.reason;
      if (context.value != null) await this.ipcClient.sendBroadcast("thread-read-state-changed", { ...params, context: context.value });
    });
    this.readStateBroadcast = operation.catch(() => {});
    return operation;
  }
  async invalidateQueryCache(params: any): Promise<void> { await this.broadcast("query-cache-invalidate", params); }
  async getIdeContext({ workspaceRoot, targetClientId, timeoutMs }: any): Promise<unknown> {
    const remaining = await waitUntilInitialized(this.ipcClient, timeoutMs);
    const response = await this.ipcClient.sendRequest("ide-context", { workspaceRoot }, { targetClientId, timeoutMs: remaining });
    if (response.resultType === "error") throw new Error(response.error);
    return response.result.ideContext;
  }
  async findThreadOwner({ hostId, conversationId }: any): Promise<string | null> {
    const remaining = await waitUntilInitialized(this.ipcClient, this.ownerDiscoveryTimeoutMs);
    const response = await this.ipcClient.sendRequest("thread-owner-discovery", { hostId, conversationId }, { timeoutMs: remaining });
    if (response.resultType === "error") {
      if (response.error === "no-client-found") return null;
      throw new Error(response.error);
    }
    return response.handledByClientId;
  }
  async requestThreadFollower({ hostId, request: { method, params }, targetClientId, timeoutMs }: any): Promise<any> {
    const remaining = await waitUntilInitialized(this.ipcClient, timeoutMs);
    if (method === "thread-follower-start-turn" && "turnStart" in params && (params.turnStart.context?.responseItems?.length ?? 0) > 0) {
      const discovery = await this.ipcClient.sendRequest(
        "thread-owner-discovery", { hostId, conversationId: params.conversationId },
        { targetClientId, timeoutMs: remaining },
      ).catch(() => null);
      if (discovery?.resultType !== "success" || discovery.handledByClientId !== targetClientId || discovery.result?.supportsUntrustedAppInput !== true)
        throw new Error(UNTRUSTED_INPUT_ERROR);
    }
    return this.ipcClient.sendRequest(method, params, {
      hostId: hostId === "local" ? undefined : hostId,
      targetClientId,
      timeoutMs: remaining,
    });
  }

  private async broadcast(method: string, params: any, options?: any): Promise<void> {
    await this.ipcClient.waitUntilInitialized({ timeoutMs: DEFAULT_TIMEOUT_MS });
    await this.ipcClient.sendBroadcast(method, params, options);
  }
}

export async function waitUntilInitialized(client: any, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<number> {
  const startedAt = Date.now();
  await client.waitUntilInitialized({ timeoutMs });
  return Math.max(0, timeoutMs - (Date.now() - startedAt));
}

/** Register thread-owner/follower request handlers on an IPC client (original `b9`). */
export function createThreadOwnerRegistration({ hostId, ipcClient, canHandle, discoverOwner, requestThreadFollower }: any): () => void {
  const registerFollower = (method: string, timeoutMs = DEFAULT_TIMEOUT_MS) => ipcClient.addRequestHandler(
    method,
    (params: any, request: any) => canHandle(params, request.hostId ?? hostId),
    async ({ params, hostId: requestHostId }: any) => {
      const response = await copyAndDispose(
        requestThreadFollower({ hostId: requestHostId ?? hostId, request: { method, params } }),
        timeoutMs,
        `${method}-timeout`,
      );
      if (response.method !== method) throw new Error("thread-follower-response-method-mismatch");
      return response.result;
    },
  );
  const disposers = [
    ipcClient.addRequestHandler(
      "thread-owner-discovery",
      async ({ hostId: requestHostId, conversationId }: any) => requestHostId === hostId && discoverOwner(conversationId),
      async () => ({ supportsUntrustedAppInput: true }),
    ),
    registerFollower("thread-follower-start-turn"),
    registerFollower("thread-follower-load-complete-history", COMPLETE_HISTORY_TIMEOUT_MS),
    ...[
      "thread-follower-compact-thread", "thread-follower-steer-turn", "thread-follower-interrupt-turn",
      "thread-follower-update-thread-settings", "thread-follower-update-daybreak", "thread-follower-edit-last-user-turn",
      "thread-follower-command-approval-decision", "thread-follower-file-approval-decision",
      "thread-follower-permissions-request-approval-response", "thread-follower-submit-user-input",
      "thread-follower-submit-mcp-server-elicitation-response", "thread-follower-set-queued-follow-ups-state",
    ].map((method) => registerFollower(method)),
  ];
  return () => { ownedThreadsByClient.get(ipcClient)?.clear(); for (const dispose of disposers) dispose(); };
}

export { ClientCoordinationService as p, createThreadOwnerRegistration as h };
