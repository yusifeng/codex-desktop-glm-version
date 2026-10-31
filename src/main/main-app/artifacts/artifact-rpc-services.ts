// @ts-nocheck

/** Creates disposable RPC adapters for external document bindings and artifact-session operations. */
export function createArtifactRpcServices(dependencies: Record<string, any>) {
  const { RpcHandlerBase } = dependencies;

  class ExternalDocumentBindingSession extends RpcHandlerBase {
    activateDocument;
    unbindDocument;
    constructor(activateDocument, unbindDocument) {
      (super(), (this.activateDocument = activateDocument), (this.unbindDocument = unbindDocument));
    }
    activate(request) {
      return this.activateDocument(request);
    }
    unbind() {
      return this.unbindDocument();
    }
    [Symbol.dispose]() {
      this.unbind();
    }
  }

  class ArtifactSessionOperationsSubscription extends RpcHandlerBase {
    operations;
    constructor(operations) {
      (super(), (this.operations = operations));
    }
    append(request) {
      return this.operations.append(request);
    }
    markDirty() {
      this.operations.markDirty();
    }
    readAsset(request) {
      return this.operations.readAsset(request);
    }
    unsubscribe() {
      this.operations.unsubscribe();
    }
    [Symbol.dispose]() {
      this.unsubscribe();
    }
  }

  return { ExternalDocumentBindingSession, ArtifactSessionOperationsSubscription };
}

if (typeof module !== "undefined") {
  module.exports = { createArtifactRpcServices };
}
