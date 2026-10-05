/** Terminal state for one page-facing annotation control handle. */
function createAnnotationControlHandleState() {
  let disposed = false;
  return {
    get disposed() { return disposed; },
    dispose() { if (disposed) return false; disposed = true; return true; },
  };
}
export { createAnnotationControlHandleState };
if (typeof module !== `undefined`) module.exports = { createAnnotationControlHandleState };
