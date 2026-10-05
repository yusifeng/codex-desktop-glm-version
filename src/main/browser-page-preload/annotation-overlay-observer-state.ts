/** Idempotent terminal gate for the annotation overlay mutation observer. */
function createAnnotationOverlayObserverState() {
  let disposed = false;
  return {
    get disposed() { return disposed; },
    dispose() {
      if (disposed) return false;
      disposed = true;
      return true;
    },
  };
}

export { createAnnotationOverlayObserverState };
if (typeof module !== `undefined`) module.exports = { createAnnotationOverlayObserverState };
