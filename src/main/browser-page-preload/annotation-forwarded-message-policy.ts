const forwardedAnnotationMessageTypes = new Set([
  `browser-sidebar-runtime-prepare-comment-screenshot`, `browser-sidebar-runtime-clear-comment-screenshot`,
  `browser-sidebar-runtime-capture-text-selection`, `browser-sidebar-runtime-select-comment`,
  `browser-sidebar-runtime-close-editor`, `browser-sidebar-runtime-design-scrub-changed`,
  `browser-sidebar-runtime-create-comment-at-point`, `browser-sidebar-runtime-create-comment-from-selection`,
  `browser-sidebar-runtime-open-design-editor-at-point`, `browser-sidebar-runtime-annotation-selection-hover-state`,
  `browser-sidebar-runtime-annotation-selection-modifier-state`, `browser-sidebar-runtime-remove-annotation-selection`,
  `browser-sidebar-runtime-restore-editor`,
]);
function isForwardedAnnotationMessage(type: string) { return forwardedAnnotationMessageTypes.has(type); }
export { isForwardedAnnotationMessage };
if (typeof module !== `undefined`) module.exports = { isForwardedAnnotationMessage };
