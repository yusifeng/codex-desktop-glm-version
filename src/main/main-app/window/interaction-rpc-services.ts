// @ts-nocheck

/** Creates the per-window quick-chat and realtime interaction RPC adapters. */
export function createInteractionRpcServices(dependencies: Record<string, any>) {
  const { RpcHandlerBase } = dependencies;

  class QuickChatWindowService extends RpcHandlerBase {
    controller;
    origin;

    constructor(controller: any, origin: any) {
      super();
      this.controller = controller;
      this.origin = origin;
    }

    addToComposer(payload: any) {
      return this.controller.addToComposer(payload);
    }

    clearPrewarm() {
      this.controller.clearPrewarm(this.origin);
    }

    open({ conversationId, contextSourceThread, popoverBounds }: any) {
      return this.controller.open(
        this.origin,
        conversationId,
        contextSourceThread,
        popoverBounds,
      );
    }

    prewarm() {
      this.controller.prewarm(this.origin);
    }

    rendererReady(payload: any) {
      this.controller.handleRendererReady(this.origin, payload);
    }
  }

  class RealtimeVoiceRuntimeService extends RpcHandlerBase {
    controller;
    origin;
    realtimeVoice;
    markEphemeral;

    constructor(
      controller: any,
      origin: any,
      realtimeVoice: any,
      markEphemeral: any,
    ) {
      super();
      this.controller = controller;
      this.origin = origin;
      this.realtimeVoice = realtimeVoice;
      this.markEphemeral = markEphemeral;
    }

    registerRealtimeStarter(start: any, cancelStart: any, complete: any) {
      const realtimeVoice = this.realtimeVoice;
      this.controller.registerStarter(
        this.origin.id,
        start,
        cancelStart,
        complete,
        realtimeVoice == null
          ? undefined
          : () => {
              const snapshot = realtimeVoice.getSnapshot();
              switch (snapshot.phase) {
                case "inactive":
                case "starting":
                  return false;
                case "active":
                  realtimeVoice.control(snapshot.locator, { type: "stop" });
                  return true;
                case "stopping":
                  return true;
              }
            },
      );
    }

    async requestRealtimeStart(request: any, options: any) {
      if (
        request.source === "composer_button_existing_thread" &&
        request.ephemeral === true
      ) {
        if (this.markEphemeral == null)
          throw Error("Ephemeral voice history is unavailable");
        this.markEphemeral(request.locator);
      }
      await this.controller.requestStart(this.origin, request, options);
    }

    cancelRealtimeSessionStart() {
      return this.controller.cancelStart(this.origin);
    }

    completeRealtimeSession() {
      this.controller.completeSession(this.origin.id);
    }

    unregisterRealtimeStarter() {
      this.controller.unregisterStarter(this.origin.id);
    }
  }

  return { QuickChatWindowService, RealtimeVoiceRuntimeService };
}

if (typeof module !== "undefined")
  module.exports = { createInteractionRpcServices };
