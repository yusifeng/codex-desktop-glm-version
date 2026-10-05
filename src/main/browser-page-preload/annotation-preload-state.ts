/** Mutable lifecycle flags shared by the annotation preload runtime callbacks. */
type AnnotationPreloadState = {
  siteAnnotationApiAvailable: boolean;
  destroyed: boolean;
  hasActiveEditor: boolean;
  permissionGranted: boolean;
};

function createAnnotationPreloadState(initial?: Partial<AnnotationPreloadState>) {
  const state: AnnotationPreloadState = {
    siteAnnotationApiAvailable: initial?.siteAnnotationApiAvailable === true,
    destroyed: initial?.destroyed === true,
    hasActiveEditor: initial?.hasActiveEditor === true,
    permissionGranted: initial?.permissionGranted === true,
  };
  return {
    get siteAnnotationApiAvailable() { return state.siteAnnotationApiAvailable; },
    get destroyed() { return state.destroyed; },
    get hasActiveEditor() { return state.hasActiveEditor; },
    get permissionGranted() { return state.permissionGranted; },
    setSiteAnnotationApiAvailable(value: boolean) { state.siteAnnotationApiAvailable = value === true; },
    setDestroyed(value = true) { state.destroyed = value === true; },
    setActiveEditor(value: boolean) { state.hasActiveEditor = value === true; },
    setPermissionGranted(value: boolean) { state.permissionGranted = value === true; },
    snapshot(): AnnotationPreloadState { return { ...state }; },
  };
}

export { createAnnotationPreloadState };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadState };
