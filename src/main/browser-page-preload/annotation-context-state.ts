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
  return {
    interactionMode: message.interactionMode,
    annotationEditorMode: message.annotationEditorMode ?? `comment`,
    isAgentControllingBrowser: message.isAgentControllingBrowser,
    canUseTweaks: message.canUseTweaks !== false,
    canUseAnnotationMultiSelect: message.canUseAnnotationMultiSelect === true,
    canUseSiteAnnotationApi: isSiteAnnotationApiAvailable && message.siteAnnotationFeaturesEnabled !== false,
    isDesignModifierPressed: message.isDesignModifierPressed === true,
    areAnnotationMarkersVisible: message.areAnnotationMarkersVisible !== false,
    isAnnotationSuspended: message.isAnnotationSuspended === true,
    isTweaksEditorOpen: message.isTweaksEditorOpen === true,
    comments: message.comments,
    intlConfig: message.intlConfig,
    viewportScale: message.viewportScale ?? 1,
    zoomPercent: message.zoomPercent,
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
