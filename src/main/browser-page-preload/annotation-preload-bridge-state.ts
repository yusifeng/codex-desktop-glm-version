/** Owns subscriber and terminal-dispose state for the annotation preload bridge. */
function createAnnotationPreloadBridgeState() {
  let hasMountedSubscriber = false;
  let destroyed = false;
  let mountedUnsubscribe: (() => void) | null = null;

  return {
    get hasMountedSubscriber() { return hasMountedSubscriber; },
    get destroyed() { return destroyed; },
    get mountedUnsubscribe() { return mountedUnsubscribe; },
    markMounted() { if (!destroyed) hasMountedSubscriber = true; },
    setMountedUnsubscribe(value: (() => void) | null) { if (!destroyed) mountedUnsubscribe = value; },
    clearMountedSubscriber() {
      hasMountedSubscriber = false;
      mountedUnsubscribe = null;
    },
    dispose() {
      if (destroyed) return false;
      destroyed = true;
      hasMountedSubscriber = false;
      mountedUnsubscribe = null;
      return true;
    },
  };
}

export { createAnnotationPreloadBridgeState };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadBridgeState };
