/** Pure lifecycle decision for refreshing an annotation feature graph. */
function shouldResetAnnotationFeatureGraph(state: {
  controlsRegistry: unknown;
  siteAnnotationRequests: unknown;
  featureObserver: unknown;
  modeControllerDispose: unknown;
}): boolean {
  return state.controlsRegistry != null || state.siteAnnotationRequests != null || state.featureObserver != null || state.modeControllerDispose != null;
}

export { shouldResetAnnotationFeatureGraph };
if (typeof module !== `undefined`) module.exports = { shouldResetAnnotationFeatureGraph };
