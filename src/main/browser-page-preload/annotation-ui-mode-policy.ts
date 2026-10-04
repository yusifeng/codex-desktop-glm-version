type AnnotationUiModeState = {
  interactionMode?: unknown;
  isAnnotationSuspended?: unknown;
  canUseSiteAnnotationApi?: unknown;
  canUseTweaks?: unknown;
};

/** Derives the stable UI gates shared by the annotation React runtime. */
function deriveAnnotationUiModePolicy(state: AnnotationUiModeState) {
  const isCommentMode = state.interactionMode === `comment`;
  return {
    isCommentMode,
    isSuspended: isCommentMode && state.isAnnotationSuspended === true,
    canUseSiteAnnotationApi: state.canUseSiteAnnotationApi === true,
    canUseTweaks: state.canUseTweaks !== false,
  };
}

export { deriveAnnotationUiModePolicy };
if (typeof module !== `undefined`) module.exports = { deriveAnnotationUiModePolicy };
