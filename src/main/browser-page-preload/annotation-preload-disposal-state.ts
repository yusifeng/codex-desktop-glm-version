/**
 * Owns the terminal transition for the page-bound annotation feature graph.
 *
 * Disposal can be requested by both pagehide and a capability/mode transition.
 * Keeping the one-way transition here makes those callers safe to race and
 * keeps teardown side effects from running twice.
 */
function createAnnotationPreloadDisposalState() {
  let disposed = false;
  return {
    get disposed() { return disposed; },
    beginDispose() {
      if (disposed) return false;
      disposed = true;
      return true;
    },
  };
}

export { createAnnotationPreloadDisposalState };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadDisposalState };
