/** Mutable mounted-preview handle and terminal state. */
function createAnnotationPreviewControllerState() {
  let disposeCurrent: (() => void) | null = null;
  let disposed = false;
  return {
    get disposeCurrent() { return disposeCurrent; },
    get disposed() { return disposed; },
    setDisposeCurrent(value: (() => void) | null) { disposeCurrent = value; },
    dispose() { if (disposed) return false; disposed = true; disposeCurrent = null; return true; },
  };
}
export { createAnnotationPreviewControllerState };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreviewControllerState };
