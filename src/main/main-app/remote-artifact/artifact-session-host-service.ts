import { Uf as RpcTarget } from "@chunk/shared";

type AnyRecord = Record<string, any>;

type ConnectionInfo = unknown;

type HostClient = {
  connectionEpoch: number;
  connect(): Promise<void>;
  close(): Promise<void>;
  call(method: string, payload?: AnyRecord): Promise<unknown>;
  onDisconnect(listener: ((connectionEpoch: number) => void) | undefined): void;
  onEvent(listener: ((event: AnyRecord) => void) | undefined): void;
  onHostCall(
    listener:
      | ((method: string, request: unknown, signal: AnyRecord) => Promise<unknown>)
      | undefined,
  ): void;
};

type ExternalDocumentRegistry = {
  bind(request: AnyRecord, capture: AnyRecord, apply: AnyRecord): Promise<unknown>;
  dispose(): void;
  handleCall(method: string, request: unknown, signal: AnyRecord): Promise<unknown>;
};

type SubscriptionManager = {
  closeHostSubscription(client: HostClient, subscriptionId: string): Promise<void>;
  drain(): Array<{ client: HostClient; subscriptionId: string }>;
  handleEvent(event: AnyRecord): void;
  handleHostCall(
    client: HostClient,
    method: string,
    request: unknown,
    signal: AnyRecord,
  ): Promise<unknown>;
  open(request: AnyRecord, onUpdate: AnyRecord, onFlush: AnyRecord): Promise<AnyRecord>;
};

type NativeFileService = {
  getTargets(request: AnyRecord): Promise<AnyRecord>;
  performFileAction(request: AnyRecord): Promise<AnyRecord>;
  readSnapshot(request: AnyRecord): Promise<AnyRecord>;
};

type SubscriptionConnection = {
  connect(): Promise<HostClient>;
  getActiveClient(): HostClient | undefined;
  isClientActive(client: HostClient): boolean;
};

type NativeHostOperations = {
  publishNativeSnapshot(request: AnyRecord): Promise<AnyRecord>;
  resolveArtifactKind(request: AnyRecord): Promise<AnyRecord>;
};

export type ArtifactSessionHostServiceDependencies = {
  compareConnectionInfo(left: ConnectionInfo, right: ConnectionInfo): boolean;
  createClient(info: ConnectionInfo): Promise<HostClient>;
  createExternalDocuments(
    connect: (kind: string) => Promise<((method: string, payload: AnyRecord) => Promise<unknown>) | null>,
  ): ExternalDocumentRegistry;
  createNativeFiles(operations: NativeHostOperations): NativeFileService;
  createSubscriptions(connection: SubscriptionConnection): SubscriptionManager;
  getViewerConnectionInfo(): ConnectionInfo | null;
  isErrorCode(error: unknown, code: string): boolean;
  logFailure(event: string, error: unknown): void;
  parseArtifactKind(value: unknown): "presentation" | "spreadsheet";
  parseCapabilities(value: unknown): unknown;
  parseNativeSnapshot(value: unknown, artifactRef: string): AnyRecord;
  requestConnectionReconciliation?(): void;
  subscribeToConnectionInfo?(listener: (info: ConnectionInfo | null) => Promise<void>): (() => void) | void;
};

const PING_METHOD = "host.ping";
const NATIVE_SNAPSHOT_CAPABILITY = "native-snapshot-v1";

/** Owns the Artifact Session host connection and composes all host-backed child lifecycles. */
export class ArtifactSessionHostService extends RpcTarget {
  private readonly dependencies: ArtifactSessionHostServiceDependencies;
  private readonly externalDocuments: ExternalDocumentRegistry;
  private readonly nativeFiles: NativeFileService;
  private readonly subscriptions: SubscriptionManager;
  private activeClient?: HostClient;
  private connectionInfo?: ConnectionInfo;
  private connecting?: Promise<HostClient>;
  private disposePromise?: Promise<void>;
  private disposed = false;
  private unavailable = false;
  private unsubscribeConnectionInfo?: () => void;

  constructor(dependencies: ArtifactSessionHostServiceDependencies) {
    super();
    this.dependencies = dependencies;
    this.externalDocuments = dependencies.createExternalDocuments((kind) =>
      this.connectExternalDocumentHost(kind),
    );
    this.subscriptions = dependencies.createSubscriptions({
      connect: () => this.connectActiveClient(),
      getActiveClient: () => this.activeClient,
      isClientActive: (client) => !this.unavailable && this.activeClient === client,
    });
    this.nativeFiles = dependencies.createNativeFiles({
      publishNativeSnapshot: (request) => this.publishNativeSnapshot(request),
      resolveArtifactKind: (request) => this.resolveArtifactKind(request),
    });
    const unsubscribe = dependencies.subscribeToConnectionInfo?.((info) =>
      this.handleConnectionInfo(info),
    );
    if (typeof unsubscribe === "function") this.unsubscribeConnectionInfo = unsubscribe;
  }

  async bindExternalDocument(
    request: AnyRecord,
    capture: AnyRecord,
    apply: AnyRecord,
  ): Promise<unknown> {
    try {
      return await this.externalDocuments.bind(request, capture, apply);
    } catch (error) {
      this.dependencies.logFailure("external_document_binding_failed", error);
      throw Error(
        "Artifact Session document binding could not be opened. Check that the installed runtime supports externally owned documents.",
      );
    }
  }

  async getNativeOpenTargets(request: AnyRecord): Promise<AnyRecord> {
    return (await this.supportsNativeOpen())
      ? this.nativeFiles.getTargets(request)
      : { status: "failed", reason: "session-unavailable" };
  }

  async open(request: AnyRecord, onUpdate: AnyRecord, onFlush: AnyRecord): Promise<AnyRecord> {
    return this.subscriptions.open(request, onUpdate, onFlush);
  }

  async performNativeFileAction(request: AnyRecord): Promise<AnyRecord> {
    return (await this.supportsNativeOpen())
      ? this.nativeFiles.performFileAction(request)
      : { status: "failed", reason: "session-unavailable" };
  }

  async readNativeSnapshot(request: AnyRecord): Promise<AnyRecord> {
    return (await this.supportsNativeOpen())
      ? this.nativeFiles.readSnapshot(request)
      : { status: "failed", reason: "session-unavailable" };
  }

  async supportsNativeOpen(): Promise<boolean> {
    if (this.disposed || this.unavailable) return false;
    const info = this.dependencies.getViewerConnectionInfo();
    if (info == null) return false;
    try {
      const client = await this.getOrCreateClient(info);
      await client.connect();
      if (!this.isCurrentClient(client)) return false;
      const capabilities = this.dependencies.parseCapabilities(await client.call(PING_METHOD));
      return this.isCurrentClient(client) &&
        Array.isArray(capabilities) &&
        capabilities.includes(NATIVE_SNAPSHOT_CAPABILITY);
    } catch {
      return false;
    }
  }

  dispose(): Promise<void> {
    return (this.disposePromise ??= this.disposeInternal());
  }

  [Symbol.dispose](): void {
    void this.dispose();
  }

  private async connectExternalDocumentHost(
    kind: string,
  ): Promise<((method: string, payload: AnyRecord) => Promise<unknown>) | null> {
    const info = this.dependencies.getViewerConnectionInfo();
    if (info == null) return null;
    const client = await this.getOrCreateClient(info);
    await client.connect();
    const capabilities = this.dependencies.parseCapabilities(await client.call(PING_METHOD));
    if (
      !Array.isArray(capabilities) ||
      !capabilities.includes("external-documents-v1") ||
      (kind === "whiteboard" && !capabilities.includes("external-whiteboards-v1"))
    ) {
      return null;
    }
    const connectionEpoch = client.connectionEpoch;
    return async (method, payload) => {
      if (!this.isCurrentClient(client, connectionEpoch)) {
        throw Error("Artifact Session host connection changed.");
      }
      try {
        return await client.call(method, payload);
      } catch (error) {
        this.dependencies.logFailure("external_document_host_request_failed", error);
        throw Error("Artifact Session document host request failed.");
      }
    };
  }

  private async publishNativeSnapshot(request: AnyRecord): Promise<AnyRecord> {
    if (this.disposed || this.unavailable) return this.sessionUnavailable();
    const info = this.dependencies.getViewerConnectionInfo();
    if (info == null) return this.sessionUnavailable();
    let response: unknown;
    try {
      const client = await this.getOrCreateClient(info);
      await client.connect();
      if (!this.isCurrentClient(client)) return this.sessionUnavailable();
      response = await client.call("outputs.publishNativeSnapshot", {
        artifactRef: request.artifactRef,
        threadId: request.threadId,
      });
    } catch (error) {
      if (
        this.dependencies.isErrorCode(error, "VIEWER_FLUSH_FAILED") ||
        this.dependencies.isErrorCode(error, "VIEWER_FLUSH_TIMEOUT")
      ) {
        return { status: "failed", reason: "sync-failed" };
      }
      if (this.dependencies.isErrorCode(error, "INTERNAL")) {
        return { status: "failed", reason: "materialization-failed" };
      }
      if (
        !this.dependencies.isErrorCode(error, "METHOD_NOT_ALLOWED") &&
        !this.dependencies.isErrorCode(error, "UNAVAILABLE")
      ) {
        this.dependencies.logFailure("native_snapshot_failed", error);
      }
      return this.sessionUnavailable();
    }
    try {
      return {
        status: "ready",
        ...this.dependencies.parseNativeSnapshot(response, request.artifactRef),
      };
    } catch (error) {
      this.dependencies.logFailure("native_snapshot_invalid", error);
      return { status: "failed", reason: "materialization-failed" };
    }
  }

  private async resolveArtifactKind(request: AnyRecord): Promise<AnyRecord> {
    if (this.disposed || this.unavailable) return this.sessionUnavailable();
    const info = this.dependencies.getViewerConnectionInfo();
    if (info == null) return this.sessionUnavailable();
    let response: unknown;
    try {
      const client = await this.getOrCreateClient(info);
      await client.connect();
      if (!this.isCurrentClient(client)) return this.sessionUnavailable();
      response = await client.call("documents.resolveArtifactRef", {
        artifactRef: request.artifactRef,
        threadId: request.threadId,
      });
    } catch {
      return this.sessionUnavailable();
    }
    try {
      return { status: "ready", kind: this.dependencies.parseArtifactKind(response) };
    } catch (error) {
      this.dependencies.logFailure("artifact_kind_invalid", error);
      return { status: "failed", reason: "target-discovery-failed" };
    }
  }

  private async handleConnectionInfo(info: ConnectionInfo | null): Promise<void> {
    if (this.disposed) return;
    if (info == null) {
      this.invalidate();
      return;
    }
    if (this.unavailable) throw Error("Artifact Session viewer is unavailable.");
    const client = await this.getOrCreateClient(info);
    await client.connect();
    if (!this.isCurrentClient(client)) throw Error("Artifact Session viewer is unavailable.");
    await client.call(PING_METHOD);
    if (!this.isCurrentClient(client)) throw Error("Artifact Session viewer is unavailable.");
  }

  private async connectActiveClient(): Promise<HostClient> {
    if (this.disposed || this.unavailable) throw Error("Artifact Session viewer is unavailable.");
    const info = this.dependencies.getViewerConnectionInfo();
    if (info == null) throw Error("Artifact Session viewer is unavailable.");
    const client = await this.getOrCreateClient(info);
    await client.connect();
    if (!this.isCurrentClient(client)) throw Error("Artifact Session viewer is unavailable.");
    return client;
  }

  private async getOrCreateClient(info: ConnectionInfo): Promise<HostClient> {
    if (this.disposed || this.unavailable) throw Error("Artifact Session viewer is unavailable.");
    if (
      this.connectionInfo != null &&
      !this.dependencies.compareConnectionInfo(this.connectionInfo, info)
    ) {
      throw Error("Artifact Session viewer connection changed.");
    }
    if (this.activeClient != null) return this.activeClient;
    if (this.connecting != null) return this.connecting;
    this.connectionInfo = info;
    const pending = this.dependencies.createClient(info).then(async (client) => {
      if (
        this.disposed ||
        this.unavailable ||
        this.connecting !== pending ||
        !this.dependencies.compareConnectionInfo(this.connectionInfo, info)
      ) {
        void client.close().catch(() => undefined);
        throw Error("Artifact Session viewer is unavailable.");
      }
      client.onEvent((event) => this.subscriptions.handleEvent(event));
      client.onHostCall((method, request, signal) =>
        this.routeHostCall(client, method, request, signal),
      );
      client.onDisconnect((epoch) => this.handleDisconnect(client, epoch));
      this.activeClient = client;
      return client;
    });
    this.connecting = pending;
    try {
      return await pending;
    } catch (error) {
      if (this.connecting === pending) {
        this.connecting = undefined;
        this.connectionInfo = undefined;
      }
      throw error;
    }
  }

  private handleDisconnect(client: HostClient, connectionEpoch: number): void {
    if (
      this.disposed ||
      this.activeClient !== client ||
      client.connectionEpoch !== connectionEpoch
    ) {
      return;
    }
    this.invalidate();
    this.dependencies.requestConnectionReconciliation?.();
  }

  private routeHostCall(
    client: HostClient,
    method: string,
    request: unknown,
    signal: AnyRecord,
  ): Promise<unknown> {
    if (method === "externalDocument.capture" || method === "externalDocument.apply") {
      if (!this.isCurrentClient(client)) {
        throw Error("Artifact Session host connection is unavailable.");
      }
      return this.externalDocuments.handleCall(method, request, signal);
    }
    return this.subscriptions.handleHostCall(client, method, request, signal);
  }

  private async disposeInternal(): Promise<void> {
    this.disposed = true;
    this.unsubscribeConnectionInfo?.();
    this.unsubscribeConnectionInfo = undefined;
    const openedSubscriptions = this.drainChildren();
    const client = this.detachClient();
    await Promise.allSettled(
      openedSubscriptions.map(({ client, subscriptionId }) =>
        this.subscriptions.closeHostSubscription(client, subscriptionId),
      ),
    );
    if (client != null) await this.closeClient(client);
  }

  private invalidate(): void {
    this.unavailable = true;
    this.drainChildren();
    const client = this.detachClient();
    if (client != null) void this.closeClient(client);
  }

  private drainChildren(): Array<{ client: HostClient; subscriptionId: string }> {
    this.externalDocuments.dispose();
    return this.subscriptions.drain();
  }

  private detachClient(): HostClient | undefined {
    const client = this.activeClient;
    this.activeClient = undefined;
    this.connecting = undefined;
    this.connectionInfo = undefined;
    if (client != null) {
      client.onDisconnect(undefined);
      client.onEvent(undefined);
      client.onHostCall(undefined);
    }
    return client;
  }

  private async closeClient(client: HostClient): Promise<void> {
    await client.close().catch((error) => {
      this.dependencies.logFailure("client_close_failed", error);
    });
  }

  private isCurrentClient(client: HostClient, connectionEpoch = client.connectionEpoch): boolean {
    return (
      !this.disposed &&
      !this.unavailable &&
      this.activeClient === client &&
      client.connectionEpoch === connectionEpoch
    );
  }

  private sessionUnavailable(): AnyRecord {
    return { status: "failed", reason: "session-unavailable" };
  }
}

if (typeof module !== "undefined") {
  module.exports = { ArtifactSessionHostService };
}
