const forwardedAnnotationMessageTypes = new Set([
  `browser-sidebar-runtime-prepare-comment-screenshot`,
  `browser-sidebar-runtime-clear-comment-screenshot`,
  `browser-sidebar-runtime-capture-text-selection`,
  `browser-sidebar-runtime-select-comment`,
  `browser-sidebar-runtime-close-editor`,
  `browser-sidebar-runtime-design-scrub-changed`,
  `browser-sidebar-runtime-create-comment-at-point`,
  `browser-sidebar-runtime-create-comment-from-selection`,
  `browser-sidebar-runtime-open-design-editor-at-point`,
  `browser-sidebar-runtime-annotation-selection-hover-state`,
  `browser-sidebar-runtime-annotation-selection-modifier-state`,
  `browser-sidebar-runtime-remove-annotation-selection`,
  `browser-sidebar-runtime-restore-editor`,
]);

const queuedEditorMessageTypes = new Set([
  `browser-sidebar-runtime-select-comment`,
  `browser-sidebar-runtime-create-comment-at-point`,
  `browser-sidebar-runtime-create-comment-from-selection`,
  `browser-sidebar-runtime-open-design-editor-at-point`,
  `browser-sidebar-runtime-restore-editor`,
]);

function getMountedAnnotationMessageAction(type: string) {
  if (type === `browser-sidebar-runtime-sync`) return `sync`;
  return forwardedAnnotationMessageTypes.has(type) ? `forward` : `ignore`;
}

function getPreMountAnnotationMessageAction(type: string) {
  if (type === `browser-sidebar-runtime-annotation-permission-result`) return `permission-result`;
  if (type === `browser-site-annotation-feature-preview`) return `preview`;
  if (type === `browser-sidebar-runtime-sync`) return `sync`;
  if (type === `browser-sidebar-runtime-capture-text-selection`) return `capture-text-selection`;
  if (queuedEditorMessageTypes.has(type)) return `queue-editor-message`;
  if (type === `browser-sidebar-runtime-close-editor`) return `close-editor`;
  return `ignore`;
}

export { getMountedAnnotationMessageAction, getPreMountAnnotationMessageAction };
if (typeof module !== `undefined`) module.exports = {
  getMountedAnnotationMessageAction,
  getPreMountAnnotationMessageAction,
};
