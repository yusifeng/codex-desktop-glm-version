/** Mutable state for the async annotation comment-runtime mount race. */
function createAnnotationRuntimeMountState() {
  let mountedRuntime: any = null;
  let pendingPreview: any = null;
  let mountStarted = false;
  let destroyed = false;
  return {
    get mountedRuntime() { return mountedRuntime; },
    get pendingPreview() { return pendingPreview; },
    get mountStarted() { return mountStarted; },
    get destroyed() { return destroyed; },
    beginMount() {
      if (mountStarted || destroyed) return false;
      mountStarted = true;
      return true;
    },
    setPendingPreview(preview: any) { pendingPreview = preview; },
    completeMount(runtime: any) {
      if (destroyed) return false;
      mountedRuntime = runtime;
      pendingPreview = null;
      return true;
    },
    retryAfterFailure() {
      if (destroyed || mountedRuntime != null) return false;
      mountStarted = false;
      return true;
    },
    dispose() {
      if (destroyed) return null;
      destroyed = true;
      const runtime = mountedRuntime;
      mountedRuntime = null;
      pendingPreview = null;
      return runtime;
    },
  };
}

export { createAnnotationRuntimeMountState };
if (typeof module !== `undefined`) module.exports = { createAnnotationRuntimeMountState };
