/** Applies a host annotation sync message and reports a comment-mode transition. */

type AnnotationSyncStateDependencies = {
  state: any;
  message: any;
  siteAnnotationApiAvailable: boolean;
  modeControllerMounted: boolean;
  resolveSyncState: (message: any, available: boolean) => any;
  isCommentModeActive: (state: any) => boolean;
  disposeFeatures: () => void;
  clearSiteAnnotationRequests: () => void;
  clearPreview: () => void;
};

function applyAnnotationSyncState(deps: AnnotationSyncStateDependencies) {
  const wasActive = deps.modeControllerMounted && deps.isCommentModeActive(deps.state);
  if (deps.message.canUseSiteAnnotationApi === false) deps.disposeFeatures();
  if (deps.message.isAgentControllingBrowser || deps.message.siteAnnotationFeaturesEnabled === false) {
    deps.clearSiteAnnotationRequests();
    deps.clearPreview();
  }
  const state = deps.resolveSyncState(deps.message, deps.siteAnnotationApiAvailable);
  const isActive = deps.modeControllerMounted && deps.isCommentModeActive(state);
  return { state, modeChanged: isActive !== wasActive, active: isActive };
}

export { applyAnnotationSyncState };
if (typeof module !== `undefined`) module.exports = { applyAnnotationSyncState };
