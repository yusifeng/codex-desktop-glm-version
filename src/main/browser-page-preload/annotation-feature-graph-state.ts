/** Mutable generation state for the disposable annotation feature graph. */
function createAnnotationFeatureGraphState() {
  let controlsRegistry: any = null;
  let siteAnnotationRequests: any = null;
  let featureObserver: any = null;
  let modeControllerDispose: (() => void) | null = null;
  return {
    get controlsRegistry() { return controlsRegistry; },
    get siteAnnotationRequests() { return siteAnnotationRequests; },
    get featureObserver() { return featureObserver; },
    get modeControllerDispose() { return modeControllerDispose; },
    setControlsRegistry(value: any) { controlsRegistry = value; },
    setSiteAnnotationRequests(value: any) { siteAnnotationRequests = value; },
    setFeatureObserver(value: any) { featureObserver = value; },
    setModeControllerDispose(value: (() => void) | null) { modeControllerDispose = value; },
    clear() {
      controlsRegistry = null;
      siteAnnotationRequests = null;
      featureObserver = null;
      modeControllerDispose = null;
    },
  };
}

export { createAnnotationFeatureGraphState };
if (typeof module !== `undefined`) module.exports = { createAnnotationFeatureGraphState };
