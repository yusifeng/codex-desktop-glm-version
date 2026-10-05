/** Terminal and metadata-request flags for the annotation surface observer. */
function createAnnotationSurfaceObserverState() {
  let disposed = false;
  let metadataRequested = false;
  return {
    get disposed() { return disposed; },
    get metadataRequested() { return metadataRequested; },
    requestMetadata() {
      if (disposed || metadataRequested) return false;
      metadataRequested = true;
      return true;
    },
    dispose() {
      if (disposed) return false;
      disposed = true;
      return true;
    },
  };
}

export { createAnnotationSurfaceObserverState };
if (typeof module !== `undefined`) module.exports = { createAnnotationSurfaceObserverState };
