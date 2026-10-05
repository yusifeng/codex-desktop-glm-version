/** Projects an annotation preload policy onto the runtime state boundary. */
function applyAnnotationPreloadPolicyState(state: any, policy: any) {
  const source = policy != null && typeof policy === `object` ? policy : {};
  return {
    ...(state != null && typeof state === `object` ? state : {}),
    canUseSiteAnnotationApi: source.enabled === true && source.siteAnnotationFeaturesEnabled === true,
    canUseTweaks: source.canUseTweaks === true,
    isAgentControllingBrowser: source.isAgentControllingBrowser === true,
    interactionMode: source.isAnnotationModeActive === true ? `comment` : `browse`,
  };
}

export { applyAnnotationPreloadPolicyState };
if (typeof module !== `undefined`) module.exports = { applyAnnotationPreloadPolicyState };
