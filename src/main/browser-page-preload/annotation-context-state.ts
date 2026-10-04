function createInitialAnnotationContextState(intlConfig: any) {
  return {
    interactionMode: `browse`,
    annotationEditorMode: `comment`,
    isAgentControllingBrowser: false,
    canUseTweaks: false,
    canUseAnnotationMultiSelect: false,
    canUseSiteAnnotationApi: false,
    isDesignModifierPressed: false,
    isTweaksEditorOpen: false,
    comments: [],
    intlConfig,
    viewportScale: 1,
    zoomPercent: 100,
  };
}

function resolveAnnotationSyncState(message: any, isSiteAnnotationApiAvailable: boolean) {
  const source = message != null && typeof message === `object` ? message : {};
  return {
    interactionMode: source.interactionMode ?? `browse`,
    annotationEditorMode: source.annotationEditorMode ?? `comment`,
    isAgentControllingBrowser: source.isAgentControllingBrowser === true,
    canUseTweaks: source.canUseTweaks !== false,
    canUseAnnotationMultiSelect: source.canUseAnnotationMultiSelect === true,
    canUseSiteAnnotationApi: isSiteAnnotationApiAvailable && source.siteAnnotationFeaturesEnabled !== false,
    isDesignModifierPressed: source.isDesignModifierPressed === true,
    areAnnotationMarkersVisible: source.areAnnotationMarkersVisible !== false,
    isAnnotationSuspended: source.isAnnotationSuspended === true,
    isTweaksEditorOpen: source.isTweaksEditorOpen === true,
    comments: source.comments,
    intlConfig: source.intlConfig,
    viewportScale: source.viewportScale ?? 1,
    zoomPercent: source.zoomPercent,
  };
}

function isAnnotationCommentModeActive(state: any) {
  return state.canUseSiteAnnotationApi === true && state.interactionMode === `comment`;
}

export { createInitialAnnotationContextState, isAnnotationCommentModeActive, resolveAnnotationSyncState };
if (typeof module !== `undefined`) module.exports = {
  createInitialAnnotationContextState,
  isAnnotationCommentModeActive,
  resolveAnnotationSyncState,
};
