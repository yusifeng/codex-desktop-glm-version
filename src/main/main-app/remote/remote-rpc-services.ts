// @ts-nocheck

/** Creates the thin RPC owners for remote-control environment and hosted PIP content. */
export function createRemoteRpcServices(dependencies: Record<string, any>) {
  const { RpcHandlerBase, getContentLayoutState } = dependencies;

  class RemoteControlEnvironmentService extends RpcHandlerBase {
    remoteConnectionsHandler;
    constructor(remoteConnectionsHandler) {
      (super(), (this.remoteConnectionsHandler = remoteConnectionsHandler));
    }
    renameIfDefault(request) {
      return this.remoteConnectionsHandler.renameRemoteControlEnvironmentIfDefault(request);
    }
  }

  class RemoteHostedPipContentService extends RpcHandlerBase {
    controller;
    origin;
    handleOriginGone = () => this[Symbol.dispose]();
    nativeVideoSubscriptionCountsByConversationId = new Map();
    disposed = !1;
    constructor(controller, origin) {
      (super(),
        (this.controller = controller),
        (this.origin = origin),
        origin.once(`destroyed`, this.handleOriginGone),
        origin.once(`did-navigate`, this.handleOriginGone),
        origin.once(`render-process-gone`, this.handleOriginGone));
    }
    async completeTurn(locator, turn) {
      this.controller.completeTurn(locator, turn);
    }
    async getState() {
      return this.controller.getTaskState();
    }
    async getBrowserFrameState() {
      return this.controller.getBrowserFrameState();
    }
    async getContentLayoutState() {
      return getContentLayoutState();
    }
    async hideTask(locator) {
      return this.controller.hideTask(locator);
    }
    async hideForAllActiveTasks() {
      return this.controller.hideAllActiveTasks();
    }
    async importLegacyHiddenTaskIds(threadIds) {
      return this.controller.importLegacyHiddenTaskIds(threadIds);
    }
    async interactWithPresentation(locator, presentationId, interaction) {
      this.controller.interactWithPresentation(locator, presentationId, interaction);
    }
    async showTask(locator, options) {
      return this.controller.showTask(locator, options);
    }
    async setPlacement(locator, placement) {
      this.controller.setPlacement(locator, placement);
    }
    async setNativeVideoReady(locator, ready) {
      this.controller.setNativeVideoReady(locator, ready);
    }
    async startNativeVideo(conversationId) {
      if (this.disposed) return;
      let count = this.nativeVideoSubscriptionCountsByConversationId.get(conversationId) ?? 0;
      (this.nativeVideoSubscriptionCountsByConversationId.set(conversationId, count + 1),
        this.controller.startNativeVideo(conversationId));
    }
    async stopNativeVideo(conversationId) {
      let count = this.nativeVideoSubscriptionCountsByConversationId.get(conversationId);
      count != null &&
        (count === 1
          ? this.nativeVideoSubscriptionCountsByConversationId.delete(conversationId)
          : this.nativeVideoSubscriptionCountsByConversationId.set(conversationId, count - 1),
        this.controller.stopNativeVideo(conversationId));
    }
    [Symbol.dispose]() {
      if (!this.disposed) {
        ((this.disposed = !0),
          this.origin.removeListener(`destroyed`, this.handleOriginGone),
          this.origin.removeListener(`did-navigate`, this.handleOriginGone),
          this.origin.removeListener(`render-process-gone`, this.handleOriginGone));
        for (let [conversationId, count] of this.nativeVideoSubscriptionCountsByConversationId)
          for (let index = 0; index < count; index += 1)
            this.controller.stopNativeVideo(conversationId);
        this.nativeVideoSubscriptionCountsByConversationId.clear();
      }
    }
  }

  return { RemoteControlEnvironmentService, RemoteHostedPipContentService };
}

if (typeof module !== "undefined") {
  module.exports = { createRemoteRpcServices };
}
