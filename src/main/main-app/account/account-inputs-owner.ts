export type AccountInputSource = "account-info" | "accounts-check" | "workspace-settings";

type Schema<T> = {
  parse(value: unknown): T;
  safeParse(value: unknown): { success: true; data: T } | { success: false };
};

type Identity = {
  kind: string;
  accountId?: string;
  userId?: string;
  authMode?: string;
};

type IdentityContext = {
  executionHostKey: unknown;
  identity: Identity;
};

type QueryState = {
  data?: unknown;
  isInvalidated?: boolean;
};

type QueryClient = {
  cancelQueries(options: { queryKey: readonly unknown[] }): Promise<unknown>;
  invalidateQueries(options: { queryKey: readonly unknown[] }): Promise<unknown>;
  fetchQuery(options: {
    queryKey: readonly unknown[];
    staleTime: number;
    queryFn(context: { signal: AbortSignal }): Promise<unknown>;
  }): Promise<unknown>;
  getQueryState(queryKey: readonly unknown[]): QueryState | undefined;
  clear(): void;
};

type DisposableBag = {
  add(disposable: unknown): void;
  dispose(): void;
};

type Connection = {
  registerInternalAuthenticatedPrincipalChangeHandler(callback: () => void): unknown;
  registerInternalNotificationHandler(callback: (notification: { method: string }) => void): unknown;
  registerInternalConnectionStateHandler(callback: () => void): unknown;
};

type ConnectionRegistry = {
  subscribe(
    callback: (event: { hostId: string; type: string; connection: Connection }) => void,
  ): unknown;
  getMaybeConnection(hostId: string): Connection | null | undefined;
};

type RpcCall = PromiseLike<unknown> & { [Symbol.dispose](): void };
type AccountInputSubscription = {
  dup(): AccountInputSubscription;
  onRpcBroken(callback: () => void): void;
  (event: Record<string, unknown>): RpcCall;
  [Symbol.dispose](): void;
};

type AccountInputsDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  DisposableBag: new () => DisposableBag;
  QueryClient: new (options: Record<string, unknown>) => QueryClient;
  UnsubscribeHandle: new (cleanup: () => void) => {
    unsubscribe(): void;
    [Symbol.dispose](): void;
  };
  stringSchema: Schema<string>;
  requestProfileSchema: Schema<unknown>;
  publishChatGptProfileSchema: Schema<{
    accountId: string;
    userId: string;
    profile: unknown;
  }>;
  accountsCheckSchema: Schema<unknown>;
  workspaceSettingsSchema: Schema<unknown>;
  sourceSchema: Schema<AccountInputSource> & { options: AccountInputSource[] };
  localHostId: string;
  requestTimeoutMs?: number;
  raceWithAbortSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T>;
  readAccountInfo(registry: ConnectionRegistry): Promise<unknown>;
  identitiesEqual(left: Identity, right: Identity): boolean;
  AuthenticatedDesktopFetchError: new (...args: any[]) => Error & {
    status: number;
    errorCode?: string;
  };
};

const INVALIDATION_PREFIXES: Record<AccountInputSource, readonly string[]> = {
  "account-info": ["vscode", "account-info"],
  "accounts-check": ["accounts", "check"],
  "workspace-settings": ["accounts", "settings"],
};

/**
 * Builds the account-input owner while keeping the bundled QueryClient runtime
 * injectable. The returned class owns one cache, one identity epoch, and all
 * renderer subscriptions for the active local app-server connection.
 */
export function createAccountInputsOwnerClass(dependencies: AccountInputsDependencies) {
  const timeoutMs = dependencies.requestTimeoutMs ?? 10_000;

  return class AccountInputsOwner extends dependencies.RpcHandlerBase {
    private readonly queryClient = new dependencies.QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 60_000, structuralSharing: false },
      },
    });
    private readonly disposables = new dependencies.DisposableBag();
    private readonly subscriptions = new Set<AccountInputSubscription>();
    private connectionDisposables = new dependencies.DisposableBag();
    private identityAbortController = new AbortController();
    private disposed = false;
    private chatGptProfile: { identity: Identity; profile: unknown } | null = null;

    constructor(
      private readonly connectionRegistry: ConnectionRegistry,
      private readonly initialConnection: Connection,
      private readonly readIdentityContext: (hostId: string) => Promise<IdentityContext | null>,
      private readonly fetchAuthenticatedJson: (
        path: string,
        options: { signal: AbortSignal; requestProfile: unknown },
      ) => Promise<unknown>,
    ) {
      super();
      this.disposables.add(
        connectionRegistry.subscribe(({ hostId, type, connection }) => {
          if (hostId !== dependencies.localHostId) return;
          this.connectionDisposables.dispose();
          this.connectionDisposables = new dependencies.DisposableBag();
          this.resetIdentityEpoch();
          if (type !== "added") return;
          this.connectionDisposables.add(
            connection.registerInternalAuthenticatedPrincipalChangeHandler(() =>
              this.resetIdentityEpoch(),
            ),
          );
          this.connectionDisposables.add(
            connection.registerInternalNotificationHandler((notification) => {
              if (notification.method === "account/updated") this.resetIdentityEpoch();
            }),
          );
          this.connectionDisposables.add(
            connection.registerInternalConnectionStateHandler(() => this.resetIdentityEpoch()),
          );
        }),
      );
    }

    readAccountInfo(force = false) {
      return this.readQuery(["account-info"], 5_000, force, () =>
        dependencies.readAccountInfo(this.connectionRegistry),
      );
    }

    async publishChatGptRequestProfile(value: unknown): Promise<boolean> {
      const publication = dependencies.publishChatGptProfileSchema.parse(value);
      const epoch = this.identityAbortController;
      const connection = this.connectionRegistry.getMaybeConnection(dependencies.localHostId);
      if (this.disposed || connection !== this.initialConnection) return false;
      let context: IdentityContext | null;
      try {
        context = await dependencies.raceWithAbortSignal(
          this.readIdentityContext(dependencies.localHostId),
          AbortSignal.any([epoch.signal, AbortSignal.timeout(timeoutMs)]),
        );
      } catch (error) {
        if (epoch.signal.aborted) return false;
        throw error;
      }
      if (
        this.disposed ||
        epoch.signal.aborted ||
        this.connectionRegistry.getMaybeConnection(dependencies.localHostId) !== connection ||
        context?.identity.kind !== "chatgpt" ||
        context.identity.accountId !== publication.accountId ||
        context.identity.userId !== publication.userId
      ) {
        return false;
      }
      this.chatGptProfile = { identity: context.identity, profile: publication.profile };
      return true;
    }

    getChatGptReadInputs = (identity: Identity) => {
      const publication = this.chatGptProfile;
      return !this.disposed &&
        publication != null &&
        this.connectionRegistry.getMaybeConnection(dependencies.localHostId) ===
          this.initialConnection &&
        dependencies.identitiesEqual(publication.identity, identity)
        ? {
            connection: this.initialConnection,
            profile: publication.profile,
            signal: this.identityAbortController.signal,
          }
        : null;
    };

    readAccounts(language: unknown, force = false) {
      const parsedLanguage = dependencies.stringSchema.parse(language);
      return this.readQuery(["accounts-check", parsedLanguage], 60_000, force, async (signal) =>
        dependencies.accountsCheckSchema.parse(
          await this.fetchAuthenticatedJson("/wham/accounts/check", {
            signal,
            requestProfile: { kind: "codex", language: parsedLanguage },
          }),
        ),
      );
    }

    readWorkspaceSettings(
      input: { accountId: unknown; profile: unknown },
      force = false,
    ) {
      const accountId = dependencies.stringSchema.parse(input.accountId);
      const profile = dependencies.requestProfileSchema.parse(input.profile);
      return this.readQuery(
        ["workspace-settings", accountId, profile],
        force ? 0 : 60_000,
        false,
        async (signal) =>
          dependencies.workspaceSettingsSchema.parse(
            await this.fetchAuthenticatedJson(
              `/accounts/${encodeURIComponent(accountId)}/settings`,
              { signal, requestProfile: profile },
            ),
          ),
      );
    }

    async invalidateWorkspaceSettings(accountIdValue: unknown): Promise<void> {
      if (this.disposed) return;
      const accountId = dependencies.stringSchema.parse(accountIdValue);
      const queryKey = ["workspace-settings", accountId];
      await Promise.all([
        this.queryClient.cancelQueries({ queryKey }),
        this.queryClient.invalidateQueries({ queryKey }),
      ]);
      this.publishInvalidation({
        type: "query",
        source: "workspace-settings",
        accountId,
      });
    }

    async invalidate(sourceValue: unknown): Promise<void> {
      if (this.disposed) return;
      const source = dependencies.sourceSchema.parse(sourceValue);
      const queryKey = [source];
      await Promise.all([
        this.queryClient.cancelQueries({ queryKey }),
        this.queryClient.invalidateQueries({ queryKey }),
      ]);
      this.publishInvalidation(
        source === "workspace-settings"
          ? { type: "query", source, accountId: undefined }
          : { type: "query", source },
      );
    }

    async subscribe(subscription: AccountInputSubscription) {
      if (this.disposed) throw new Error("Account input owner disposed");
      const stream = subscription.dup();
      this.subscriptions.add(stream);
      const handle = new dependencies.UnsubscribeHandle(() => {
        this.subscriptions.delete(stream);
        stream[Symbol.dispose]();
      });
      stream.onRpcBroken(() => handle.unsubscribe());
      return handle;
    }

    invalidateQueryCache = (queryKey: unknown[]) => {
      if (
        queryKey[0] === "accounts" &&
        queryKey[1] === "settings" &&
        queryKey.length === 3
      ) {
        const accountId = dependencies.stringSchema.safeParse(queryKey[2]);
        if (accountId.success) void this.invalidateWorkspaceSettings(accountId.data);
        return;
      }
      for (const source of dependencies.sourceSchema.options) {
        const prefix = INVALIDATION_PREFIXES[source];
        if (
          queryKey.length <= prefix.length &&
          queryKey.every((value, index) => value === prefix[index])
        ) {
          void this.invalidate(source);
        }
      }
    };

    dispose = () => {
      this.disposed = true;
      this.disposables.dispose();
      this.connectionDisposables.dispose();
      this.resetIdentityEpoch();
      for (const subscription of this.subscriptions) subscription[Symbol.dispose]();
      this.subscriptions.clear();
    };

    private async readQuery(
      queryKey: readonly unknown[],
      staleTime: number,
      force: boolean,
      query: (signal: AbortSignal) => Promise<unknown>,
    ): Promise<Record<string, unknown>> {
      if (this.disposed) return { status: "unavailable", reason: "retired" };
      const connection = this.connectionRegistry.getMaybeConnection(dependencies.localHostId);
      if (connection == null || connection !== this.initialConnection)
        return { status: "unavailable", reason: "connection" };
      const epoch = this.identityAbortController;
      const signal = AbortSignal.any([epoch.signal, AbortSignal.timeout(timeoutMs)]);
      const isCurrent = () =>
        !this.disposed &&
        !epoch.signal.aborted &&
        this.connectionRegistry.getMaybeConnection(dependencies.localHostId) === connection;
      try {
        const before = await dependencies.raceWithAbortSignal(
          this.readIdentityContext(dependencies.localHostId),
          signal,
        );
        if (!isCurrent()) return { status: "unavailable", reason: "retired" };
        if (before == null) return { status: "unavailable", reason: "identity" };
        if (queryKey[0] !== "account-info" && before.identity.kind !== "chatgpt")
          return { status: "unavailable", reason: "unsupported-auth" };
        const identityQueryKey = [...queryKey, before];
        if (force) await this.queryClient.invalidateQueries({ queryKey: identityQueryKey });
        if (!isCurrent()) return { status: "unavailable", reason: "retired" };
        const data = await dependencies.raceWithAbortSignal(
          this.queryClient.fetchQuery({
            queryKey: identityQueryKey,
            staleTime,
            queryFn: ({ signal: querySignal }) => {
              const combinedSignal = AbortSignal.any([
                epoch.signal,
                querySignal,
                AbortSignal.timeout(timeoutMs),
              ]);
              return dependencies.raceWithAbortSignal(query(combinedSignal), combinedSignal);
            },
          }),
          signal,
        );
        const after = await dependencies.raceWithAbortSignal(
          this.readIdentityContext(dependencies.localHostId),
          signal,
        );
        if (!isCurrent()) return { status: "unavailable", reason: "retired" };
        if (
          after == null ||
          after.executionHostKey !== before.executionHostKey ||
          !dependencies.identitiesEqual(after.identity, before.identity)
        ) {
          this.resetIdentityEpoch();
          return { status: "unavailable", reason: "retired" };
        }
        const state = this.queryClient.getQueryState(identityQueryKey);
        return state?.data !== data || state.isInvalidated
          ? { status: "unavailable", reason: "retired" }
          : { status: "ready", data };
      } catch (error) {
        return isCurrent()
          ? {
              status: "error",
              message: error instanceof Error ? error.message : "Account input read failed",
              httpStatus:
                error instanceof dependencies.AuthenticatedDesktopFetchError ? error.status : null,
              errorCode:
                error instanceof dependencies.AuthenticatedDesktopFetchError
                  ? error.errorCode
                  : undefined,
            }
          : { status: "unavailable", reason: "retired" };
      }
    }

    private resetIdentityEpoch() {
      this.identityAbortController.abort();
      this.identityAbortController = new AbortController();
      this.queryClient.clear();
      this.chatGptProfile = null;
      this.publishInvalidation({ type: "identity" });
    }

    private publishInvalidation(event: Record<string, unknown>) {
      for (const subscription of this.subscriptions) {
        const call = subscription(event);
        call.then(
          () => call[Symbol.dispose](),
          () => call[Symbol.dispose](),
        );
      }
    }
  };
}
