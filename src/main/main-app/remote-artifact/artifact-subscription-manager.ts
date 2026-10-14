type AnyRecord = Record<string, any>;

type RpcEndpoint = {
  (...args: any[]): any;
  dup?(): RpcEndpoint;
  onRpcBroken?(listener: () => void): void;
  [Symbol.dispose]?(): void;
};

type HostClient = {
  connectionEpoch: number;
  call(method: string, payload: AnyRecord): Promise<unknown>;
};

type SubscriptionState = {
  artifactRef: string;
  closed: boolean;
  hostClient?: HostClient;
  hostConnectionEpoch?: number;
  hostFlushContexts?: Set<{ client: HostClient; connectionEpoch: number }>;
  hostOpened: boolean;
  onFlush: RpcEndpoint;
  onUpdate: RpcEndpoint;
  subscriptionId: string;
  threadId: string;
};

export type ArtifactSubscriptionManagerDependencies = {
  connect(): Promise<HostClient>;
  createId(): string;
  createSubscription(operations: AnyRecord): unknown;
  disposeValue(value: unknown): void;
  getActiveClient(): HostClient | undefined;
  isClientActive(client: HostClient): boolean;
  isErrorCode(error: unknown, code: string): boolean;
  logFailure(event: string, error: unknown): void;
  parseAppendResult(value: unknown): { applied: boolean; stateVersion: number };
  parseAssetResult(value: unknown, expectedSha256: string): Uint8Array;
  parseEvent(value: unknown): unknown;
  parseFlushSubscriptionId(value: unknown): string;
  parseOpenResult(value: unknown, artifactRef: string, subscriptionId: string): unknown;
  serializeBytes(bytes: Uint8Array): string;
};

/** Owns Artifact Session subscriptions, callback routing, host state, and endpoint disposal. */
export class ArtifactSubscriptionManager {
  private readonly dependencies: ArtifactSubscriptionManagerDependencies;
  private readonly subscriptions = new Map<string, SubscriptionState>();
  private disposed = false;

  constructor(dependencies: ArtifactSubscriptionManagerDependencies) {
    this.dependencies = dependencies;
  }

  async open(request: AnyRecord, onUpdate: RpcEndpoint, onFlush: RpcEndpoint): Promise<AnyRecord> {
    if (this.disposed) throw Error("Artifact Session viewer is unavailable.");
    let ownedUpdate: RpcEndpoint | undefined;
    let ownedFlush: RpcEndpoint | undefined;
    let state: SubscriptionState | undefined;
    try {
      ownedUpdate = onUpdate.dup?.() ?? onUpdate;
      ownedFlush = onFlush.dup?.() ?? onFlush;
      const client = await this.dependencies.connect();
      const subscriptionId = this.dependencies.createId();
      if (this.subscriptions.has(subscriptionId)) {
        throw Error("Artifact Session subscription id collision.");
      }
      state = {
        artifactRef: request.artifactRef,
        closed: false,
        hostOpened: false,
        onFlush: ownedFlush,
        onUpdate: ownedUpdate,
        subscriptionId,
        threadId: request.threadId,
      };
      this.subscriptions.set(subscriptionId, state);
      const subscription = state;
      ownedUpdate.onRpcBroken?.(() => this.close(subscription));
      ownedFlush.onRpcBroken?.(() => this.close(subscription));
      if (state.closed || this.subscriptions.get(subscriptionId) !== state) {
        throw Error("Artifact Session subscription closed while opening.");
      }
      const record = await this.openOnHost(state, client);
      if (state.closed || this.subscriptions.get(subscriptionId) !== state) {
        if (this.dependencies.isClientActive(client)) {
          await this.closeHostSubscription(client, subscriptionId);
        }
        throw Error("Artifact Session subscription closed while opening.");
      }
      const activeState = state;
      return {
        record,
        subscription: this.dependencies.createSubscription({
          append: (update: AnyRecord) => this.append(activeState, update),
          markDirty: () => this.markDirty(activeState),
          readAsset: (asset: AnyRecord) => this.readAsset(activeState, asset),
          unsubscribe: () => this.close(activeState),
        }),
      };
    } catch (error) {
      if (state == null) {
        this.disposeEndpoint(ownedUpdate);
        this.disposeEndpoint(ownedFlush);
      } else {
        this.close(state);
      }
      this.dependencies.logFailure("open_failed", error);
      throw Error("Artifact Session could not be opened.");
    }
  }

  handleEvent(event: AnyRecord): void {
    try {
      const state = this.subscriptions.get(event.subscriptionId);
      if (state == null || state.closed) return;
      this.dependencies.disposeValue(state.onUpdate(this.dependencies.parseEvent(event.event)));
    } catch (error) {
      this.dependencies.logFailure("event_delivery_failed", error);
    }
  }

  async handleHostCall(
    client: HostClient,
    method: string,
    request: unknown,
    signal: { throwIfAborted(): void },
  ): Promise<{ flushed: true }> {
    if (method !== "viewer.flush") {
      throw Error("Unsupported Artifact Session viewer callback.");
    }
    const subscriptionId = this.dependencies.parseFlushSubscriptionId(request);
    const state = this.subscriptions.get(subscriptionId);
    if (state == null || state.closed) {
      throw Error("Artifact Session viewer subscription is unavailable.");
    }
    signal.throwIfAborted();
    if (client !== this.dependencies.getActiveClient()) {
      throw Error("Artifact Session viewer connection is unavailable.");
    }
    await this.flush(state, client, client.connectionEpoch, signal);
    return { flushed: true };
  }

  drain(): Array<{ client: HostClient; subscriptionId: string }> {
    this.disposed = true;
    const states = [...this.subscriptions.values()];
    this.subscriptions.clear();
    const opened = states.flatMap((state) =>
      state.hostOpened && state.hostClient != null
        ? [{ client: state.hostClient, subscriptionId: state.subscriptionId }]
        : [],
    );
    for (const state of states) {
      state.closed = true;
      state.hostOpened = false;
      state.hostClient = undefined;
      state.hostConnectionEpoch = undefined;
      state.hostFlushContexts = undefined;
      this.disposeEndpoint(state.onUpdate);
      this.disposeEndpoint(state.onFlush);
    }
    return opened;
  }

  async closeHostSubscription(client: HostClient, subscriptionId: string): Promise<void> {
    await client
      .call("subscriptions.close", { subscriptionId })
      .then(() => undefined)
      .catch((error) => this.dependencies.logFailure("close_subscription_failed", error));
  }

  private async append(state: SubscriptionState, update: AnyRecord): Promise<AnyRecord> {
    this.assertCurrent(state);
    try {
      const value = await this.activeClientFor(state).call("documents.appendUpdate", {
        artifactRef: state.artifactRef,
        threadId: state.threadId,
        update: {
          baseStateVersion: update.baseStateVersion,
          crdtUpdateBase64: this.dependencies.serializeBytes(update.bytes),
          originId: update.originId,
          source: "user",
          ...(update.summary === undefined ? {} : { summary: update.summary }),
          updateId: update.updateId,
        },
      });
      return this.dependencies.parseAppendResult(value);
    } catch (error) {
      this.dependencies.logFailure("append_failed", error);
      throw Error("Artifact Session update could not be saved.");
    }
  }

  private markDirty(state: SubscriptionState): void {
    if (!this.isCurrent(state)) return;
    try {
      this.activeClientFor(state)
        .call("viewer.markDirty", { subscriptionId: state.subscriptionId })
        .catch((error) => this.dependencies.logFailure("mark_dirty_failed", error));
    } catch (error) {
      this.dependencies.logFailure("mark_dirty_failed", error);
    }
  }

  private async readAsset(state: SubscriptionState, asset: AnyRecord): Promise<Uint8Array | null> {
    this.assertCurrent(state);
    try {
      const value = await this.activeClientFor(state).call("assets.read", {
        artifactRef: state.artifactRef,
        sha256: asset.sha256,
        threadId: state.threadId,
      });
      return this.dependencies.parseAssetResult(value, asset.sha256);
    } catch (error) {
      if (this.dependencies.isErrorCode(error, "ASSET_NOT_FOUND")) return null;
      this.dependencies.logFailure("read_asset_failed", error);
      throw Error("Artifact Session asset could not be read.");
    }
  }

  private activeClientFor(state: SubscriptionState): HostClient {
    this.assertCurrent(state);
    const activeClient = this.dependencies.getActiveClient();
    const flushContexts = state.hostFlushContexts;
    if (flushContexts != null && flushContexts.size > 0) {
      if (
        activeClient != null &&
        [...flushContexts].some(
          ({ client, connectionEpoch }) =>
            client === activeClient && connectionEpoch === activeClient.connectionEpoch,
        )
      ) {
        return activeClient;
      }
      throw Error("Artifact Session viewer connection changed while flushing.");
    }
    if (
      activeClient == null ||
      state.hostClient !== activeClient ||
      state.hostConnectionEpoch !== activeClient.connectionEpoch ||
      !state.hostOpened
    ) {
      throw Error("Artifact Session viewer is unavailable.");
    }
    this.assertCurrent(state);
    return activeClient;
  }

  private async openOnHost(
    state: SubscriptionState,
    client: HostClient,
    connectionEpoch = client.connectionEpoch,
  ): Promise<unknown> {
    let hostOpened = false;
    try {
      const response = await client.call("subscriptions.open", {
        artifactRef: state.artifactRef,
        subscriptionId: state.subscriptionId,
        threadId: state.threadId,
      });
      hostOpened = true;
      const record = this.dependencies.parseOpenResult(
        response,
        state.artifactRef,
        state.subscriptionId,
      );
      if (
        !this.isCurrent(state) ||
        this.dependencies.getActiveClient() !== client ||
        client.connectionEpoch !== connectionEpoch
      ) {
        throw Error("Artifact Session subscription closed while opening.");
      }
      state.hostClient = client;
      state.hostConnectionEpoch = connectionEpoch;
      state.hostOpened = true;
      return record;
    } catch (error) {
      if (state.hostClient === client && state.hostConnectionEpoch === connectionEpoch) {
        state.hostClient = undefined;
        state.hostConnectionEpoch = undefined;
        state.hostOpened = false;
      }
      if (
        hostOpened &&
        this.dependencies.isClientActive(client) &&
        client.connectionEpoch === connectionEpoch
      ) {
        await this.closeHostSubscription(client, state.subscriptionId);
      }
      throw error;
    }
  }

  private async flush(
    state: SubscriptionState,
    client: HostClient,
    connectionEpoch: number,
    signal?: { throwIfAborted(): void },
  ): Promise<void> {
    signal?.throwIfAborted();
    const context = { client, connectionEpoch };
    const contexts = state.hostFlushContexts ?? new Set();
    state.hostFlushContexts = contexts;
    contexts.add(context);
    let result: unknown;
    try {
      result = state.onFlush();
      await result;
      signal?.throwIfAborted();
    } finally {
      contexts.delete(context);
      if (contexts.size === 0 && state.hostFlushContexts === contexts) {
        state.hostFlushContexts = undefined;
      }
      this.dependencies.disposeValue(result);
    }
  }

  private close(state: SubscriptionState): void {
    if (state.closed) return;
    const client = state.hostOpened ? state.hostClient : undefined;
    state.closed = true;
    state.hostClient = undefined;
    state.hostConnectionEpoch = undefined;
    state.hostFlushContexts = undefined;
    state.hostOpened = false;
    if (this.subscriptions.get(state.subscriptionId) === state) {
      this.subscriptions.delete(state.subscriptionId);
    }
    this.disposeEndpoint(state.onUpdate);
    this.disposeEndpoint(state.onFlush);
    if (client != null && !this.disposed) {
      void this.closeHostSubscription(client, state.subscriptionId);
    }
  }

  private isCurrent(state: SubscriptionState): boolean {
    return !this.disposed && !state.closed && this.subscriptions.get(state.subscriptionId) === state;
  }

  private assertCurrent(state: SubscriptionState): void {
    if (!this.isCurrent(state)) throw Error("Artifact Session subscription is closed.");
  }

  private disposeEndpoint(endpoint: RpcEndpoint | undefined): void {
    try {
      endpoint?.[Symbol.dispose]?.();
    } catch (error) {
      this.dependencies.logFailure("callback_dispose_failed", error);
    }
  }
}

if (typeof module !== "undefined") {
  module.exports = { ArtifactSubscriptionManager };
}
