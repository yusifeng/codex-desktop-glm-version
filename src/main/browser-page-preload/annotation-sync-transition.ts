/**
 * Reduces a host annotation sync message to the lifecycle transitions it
 * requests.  Keeping these gates together prevents the runtime from applying
 * slightly different cleanup rules to preview, request, marker, and selection
 * state when a capability or mode changes.
 */
function getAnnotationSyncTransition(message: any) {
  const source = message != null && typeof message === `object` ? message : {};
  const capabilityDisabled = source.canUseSiteAnnotationApi === false;
  const agentControlled = source.isAgentControllingBrowser === true;
  const siteFeaturesDisabled = source.siteAnnotationFeaturesEnabled === false;
  const commentMode = source.interactionMode === `comment`;
  const suspended = source.isAnnotationSuspended === true;
  return {
    disposeFeatures: capabilityDisabled,
    clearSiteAnnotationRequests: agentControlled || siteFeaturesDisabled,
    clearPreview: agentControlled || siteFeaturesDisabled,
    exitCommentMode: !commentMode || suspended,
    clearSelection: source.canUseAnnotationMultiSelect !== true,
    clearMarkers: suspended || source.areAnnotationMarkersVisible === false,
  };
}

export { getAnnotationSyncTransition };
if (typeof module !== `undefined`) module.exports = { getAnnotationSyncTransition };
