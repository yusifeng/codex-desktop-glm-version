import { createAnnotationPreloadDisposalState } from "./annotation-preload-disposal-state";

type AnnotationPreloadDisposalDependencies = {
  disposeFeatures: () => void;
  clearPreview: () => void;
  setFeatureApiAvailable: (available: boolean) => void;
};

/**
 * Coordinates teardown of the page-bound annotation feature graph.
 *
 * Preview cleanup intentionally happens after feature disposal: feature
 * listeners may still release their own preview handles during disposal, and
 * the final clear guarantees no overlay survives a capability transition or
 * pagehide.  The capability flag is reset last so observers never see a
 * disabled state while the old graph is still being torn down.
 */
function createAnnotationPreloadDisposal(deps: AnnotationPreloadDisposalDependencies) {
  const state = createAnnotationPreloadDisposalState();

  const dispose = () => {
    if (!state.beginDispose()) return false;
    deps.disposeFeatures();
    deps.clearPreview();
    deps.setFeatureApiAvailable(false);
    return true;
  };

  return {
    dispose,
    get disposed() { return state.disposed; },
  };
}

export { createAnnotationPreloadDisposal };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadDisposal };
