/** Normalizes a host sync payload into the React annotation runtime context. */
function projectAnnotationRuntimeSyncState(source: any) {
  return {
    activeDesignChange: source.activeDesignChange,
    comments: source.comments,
    intlConfig: source.intlConfig,
    interactionMode: source.interactionMode,
    annotationEditorMode: source.annotationEditorMode ?? `comment`,
    isAgentControllingBrowser: source.isAgentControllingBrowser,
    canUseAnnotationMultiSelect: source.canUseAnnotationMultiSelect === true,
    canUseSiteAnnotationApi: source.canUseSiteAnnotationApi === true,
    canUseTweaks: source.canUseTweaks !== false,
    isDesignModifierPressed: source.isDesignModifierPressed === true,
    isOriginalViewEnabled: source.isOriginalViewEnabled === true,
    areAnnotationMarkersVisible: source.areAnnotationMarkersVisible !== false,
    isAnnotationSuspended: source.isAnnotationSuspended === true,
    isTweaksEditorOpen: source.isTweaksEditorOpen === true,
    viewportScale: source.viewportScale ?? 1,
    zoomPercent: source.zoomPercent,
  };
}

export { projectAnnotationRuntimeSyncState };
if (typeof module !== `undefined`) module.exports = { projectAnnotationRuntimeSyncState };
