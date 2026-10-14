type DisposableResult = Record<string, unknown> & { [Symbol.dispose]?(): void };

type RpcEndpoint = {
  (payload?: Record<string, unknown>): Promise<DisposableResult>;
  dup?(): RpcEndpoint;
  onRpcBroken?(listener: () => void): void;
  [Symbol.dispose]?(): void;
};

type CallHost = (method: string, payload: Record<string, unknown>) => Promise<unknown>;

type BindingRequest = {
  documentId: string;
  kind: string;
  targetUri: string;
  title?: string | null;
};

type BindingState = {
  activation?: Promise<void>;
  apply: RpcEndpoint;
  artifactRef: string;
  bindingId: string;
  callHost: CallHost;
  capture: RpcEndpoint;
  closed: boolean;
  request: BindingRequest;
  threadId?: string;
};

export type ExternalDocumentBindingRegistryDependencies = {
  connect(kind: string): Promise<CallHost | null>;
  createBinding(activate: (threadId: string) => Promise<void>, unbind: () => Promise<void>): unknown;
  createId(): string;
  parseApplyRequest(value: unknown): Record<string, unknown> & { bindingId: string };
  parseBindingRequest(value: unknown): { bindingId: string };
};

/** Owns external artifact bindings, callback routing, activation, and host unbinding. */
export class ExternalDocumentBindingRegistry {
  private readonly dependencies: ExternalDocumentBindingRegistryDependencies;
  private readonly bindings = new Map<string, BindingState>();
  private disposed = false;

  constructor(dependencies: ExternalDocumentBindingRegistryDependencies) {
    this.dependencies = dependencies;
  }

  async bind(request: BindingRequest, capture: RpcEndpoint, apply: RpcEndpoint): Promise<unknown> {
    let ownedCapture: RpcEndpoint | undefined;
    let ownedApply: RpcEndpoint | undefined;
    let state: BindingState | undefined;
    try {
      ownedCapture = capture.dup?.() ?? capture;
      ownedApply = apply.dup?.() ?? apply;
      const callHost = await this.dependencies.connect(request.kind);
      if (callHost == null) {
        ownedCapture[Symbol.dispose]?.();
        ownedApply[Symbol.dispose]?.();
        return { status: "unsupported" };
      }
      if (this.disposed) throw Error("Artifact Session connection is closed.");
      state = {
        artifactRef: `artifact_external_${this.dependencies.createId()}`,
        bindingId: this.dependencies.createId(),
        request,
        capture: ownedCapture,
        apply: ownedApply,
        callHost,
        closed: false,
      };
      const binding = state;
      this.bindings.set(binding.bindingId, binding);
      ownedCapture.onRpcBroken?.(() => void this.close(binding));
      ownedApply.onRpcBroken?.(() => void this.close(binding));
      return {
        status: "bound",
        artifactRef: binding.artifactRef,
        binding: this.dependencies.createBinding(
          (threadId) => this.activate(binding, threadId),
          () => this.close(binding),
        ),
      };
    } catch (error) {
      if (state == null) {
        ownedCapture?.[Symbol.dispose]?.();
        ownedApply?.[Symbol.dispose]?.();
      } else {
        await this.close(state);
      }
      throw error;
    }
  }

  async handleCall(
    method: string,
    request: unknown,
    signal: { throwIfAborted(): void },
  ): Promise<Record<string, unknown>> {
    signal.throwIfAborted();
    const { bindingId } = this.dependencies.parseBindingRequest(request);
    const binding = this.bindings.get(bindingId);
    if (binding == null || binding.closed || binding.threadId == null) {
      throw Error("Artifact Session document binding is unavailable.");
    }
    if (method === "externalDocument.capture") {
      const result = await binding.capture();
      try {
        signal.throwIfAborted();
        if (binding.closed) throw Error("Artifact Session document binding closed.");
        return { ...result };
      } finally {
        result[Symbol.dispose]?.();
      }
    }
    if (method === "externalDocument.apply") {
      const { bindingId: _bindingId, ...payload } =
        this.dependencies.parseApplyRequest(request);
      const result = await binding.apply(payload);
      try {
        return { ...result };
      } finally {
        result[Symbol.dispose]?.();
      }
    }
    throw Error("Unsupported Artifact Session document callback.");
  }

  dispose(): void {
    this.disposed = true;
    for (const binding of this.bindings.values()) void this.close(binding);
  }

  private async activate(binding: BindingState, threadId: string): Promise<void> {
    if (binding.closed || threadId.length === 0) {
      throw Error("Artifact Session document binding is unavailable.");
    }
    if (binding.threadId != null && binding.threadId !== threadId) {
      throw Error("Artifact Session document binding belongs to another task.");
    }
    binding.threadId = threadId;
    binding.activation ??= binding
      .callHost("documents.bindExternal", {
        artifactRef: binding.artifactRef,
        bindingId: binding.bindingId,
        threadId,
        documentId: binding.request.documentId,
        artifactType: binding.request.kind,
        externalTarget: { uri: binding.request.targetUri },
        ...(binding.request.title == null ? {} : { title: binding.request.title }),
      })
      .then(async () => {
        if (binding.closed) {
          await binding.callHost("documents.unbindExternal", { bindingId: binding.bindingId });
          throw Error("Artifact Session document binding closed while activating.");
        }
      })
      .catch((error) => {
        binding.activation = undefined;
        throw error;
      });
    await binding.activation;
  }

  private async close(binding: BindingState): Promise<void> {
    if (binding.closed) return;
    binding.closed = true;
    this.bindings.delete(binding.bindingId);
    binding.capture[Symbol.dispose]?.();
    binding.apply[Symbol.dispose]?.();
    if (binding.threadId != null) {
      await binding
        .callHost("documents.unbindExternal", { bindingId: binding.bindingId })
        .catch(() => undefined);
    }
  }
}

if (typeof module !== "undefined") {
  module.exports = { ExternalDocumentBindingRegistry };
}
