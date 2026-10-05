/** Applies a host annotation sync message and reports a comment-mode transition. */

import { getAnnotationSyncTransition } from "./annotation-sync-transition";

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
  const transition = getAnnotationSyncTransition(deps.message);
  const wasActive = deps.modeControllerMounted && deps.isCommentModeActive(deps.state);
  if (transition.disposeFeatures) deps.disposeFeatures();
  if (transition.clearSiteAnnotationRequests) {
    deps.clearSiteAnnotationRequests();
  }
  if (transition.clearPreview) {
    deps.clearPreview();
  }
  const state = deps.resolveSyncState(deps.message, deps.siteAnnotationApiAvailable);
  const isActive = deps.modeControllerMounted && deps.isCommentModeActive(state);
  return { state, modeChanged: isActive !== wasActive, active: isActive };
}

export { applyAnnotationSyncState };
if (typeof module !== `undefined`) module.exports = { applyAnnotationSyncState };
