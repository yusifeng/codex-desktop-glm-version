type CoordinationDependencies = {
  ClientCoordination: new (clientId: string, errorReporter: unknown) => any;
  ClientCoordinationService: new (client: any, getThreadReadStateContext: unknown) => any;
  createThreadOwnerRegistration(options: Record<string, unknown>): () => void;
  protocolVersion(message: string): number;
  waitUntilInitialized(client: any, timeoutMs: number | undefined): Promise<number | undefined>;
};

/** Builds the per-host desktop client-coordination owner used by hosted managers. */
export function createHostClientCoordinationClass(dependencies: CoordinationDependencies) {
  return class HostClientCoordination {
    private currentSession: { client: any; service: any } | null = null;
    private disposed = false;
    private removeThreadOwner: (() => void) | null = null;

    readonly bridge: any;
    readonly queuedMessages: any;

    constructor(
      private readonly hostId: string,
      private readonly errorReporter: unknown,
      private readonly getThreadReadStateContext: unknown,
      private readonly assertCurrent: () => void,
    ) {
      this.bridge = {
        setThreadOwnership: (params: unknown) => this.session.service.setThreadOwnership(params),
        registerBroadcastHandler: (name: string, handler: (message: any) => void) =>
          this.session.client.addBroadcastHandler(name, async (message: any) => {
            if ((message.version ?? 0) === dependencies.protocolVersion(name)) handler(message);
          }),
        request: async (
          method: string,
          params: unknown,
          options: {
            signal?: AbortSignal;
            timeoutMs?: number;
            targetClientId?: string;
          },
        ) => {
          this.assertCurrent();
          if (options.signal?.aborted) throw new Error("aborted");
          const timeoutMs = await dependencies.waitUntilInitialized(
            this.session.client,
            options.timeoutMs,
          );
          this.assertCurrent();
          if (options.signal?.aborted) throw new Error("aborted");
          return this.session.client.sendRequest(method, params, {
            hostId: this.hostId === "local" ? undefined : this.hostId,
            targetClientId: options.targetClientId,
            timeoutMs,
          });
        },
        threadArchived: (params: unknown) => this.session.service.threadArchived(params),
        threadUnarchived: (params: unknown) => this.session.service.threadUnarchived(params),
        threadStreamFollowingChanged: ({ targetClientIds, ...params }: any) =>
          this.session.service.threadStreamFollowingChanged({ params, targetClientIds }),
        threadStreamFollowingStatusRequested: (params: unknown) =>
          this.session.service.threadStreamFollowingStatusRequested(params),
        threadStreamStateChanged: ({ targetClientIds, ...params }: any) =>
          this.session.service.threadStreamStateChanged({ params, targetClientIds }),
      };
      this.queuedMessages = {
        broadcast: (message: Record<string, unknown>) =>
          this.session.service.threadQueuedFollowUpsChanged({
            ...message,
            hostId: this.hostId,
          }),
        registerBroadcastHandler: (handler: (message: any) => void) =>
          this.bridge.registerBroadcastHandler(
            "thread-queued-followups-changed",
            (message: any) => {
              if (message.params.hostId === this.hostId) handler(message);
            },
          ),
      };
    }

    bind(manager: any) {
      const managerHostId = manager.getHostId();
      const ownsThread = async (conversationId: string, hostId = managerHostId) => {
        this.assertCurrent();
        return (
          hostId === managerHostId &&
          manager.getStreamRole(conversationId)?.role === "owner"
        );
      };
      this.removeThreadOwner = dependencies.createThreadOwnerRegistration({
        hostId: managerHostId,
        ipcClient: this.session.client,
        canHandle: ({ conversationId }: { conversationId: string }, hostId: string) =>
          ownsThread(conversationId, hostId),
        discoverOwner: ownsThread,
        requestThreadFollower: async ({ request }: { request: unknown }) => {
          this.assertCurrent();
          return manager.handleThreadFollowerRequest(request);
        },
      });
    }

    dispose() {
      this.removeThreadOwner?.();
      this.removeThreadOwner = null;
      this.disposed = true;
      this.currentSession?.client.dispose();
      this.currentSession = null;
    }

    get client() {
      return this.session.client;
    }

    get service() {
      return this.session.service;
    }

    private get session() {
      if (this.disposed) throw new Error("Host manager coordination is disposed");
      if (this.currentSession == null) {
        const client = new dependencies.ClientCoordination("desktop", this.errorReporter);
        this.currentSession = {
          client,
          service: new dependencies.ClientCoordinationService(
            client,
            this.getThreadReadStateContext,
          ),
        };
      }
      return this.currentSession;
    }
  };
}
