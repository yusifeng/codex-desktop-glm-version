// @ts-nocheck

/** Renderer-scoped RPC adapter for native history swipe navigation state. */
export function createHistorySwipeNavigationServiceClass({ RpcHandlerBase }: Record<string, any>) {
  return class HistorySwipeNavigationService extends RpcHandlerBase {
    windowManager;
    origin;

    constructor(windowManager: any, origin: any) {
      super();
      this.windowManager = windowManager;
      this.origin = origin;
    }

    setHistorySwipeNavigationState(state: unknown) {
      this.windowManager.setHistorySwipeNavigationState(this.origin, state);
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createHistorySwipeNavigationServiceClass };
}
