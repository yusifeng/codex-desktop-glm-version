const queuedEditorMessageTypes = new Set([
  `browser-sidebar-runtime-select-comment`,
  `browser-sidebar-runtime-create-comment-at-point`,
  `browser-sidebar-runtime-create-comment-from-selection`,
  `browser-sidebar-runtime-open-design-editor-at-point`,
  `browser-sidebar-runtime-restore-editor`,
]);
function isQueuedEditorAnnotationMessage(type: string) { return queuedEditorMessageTypes.has(type); }
export { isQueuedEditorAnnotationMessage };
if (typeof module !== `undefined`) module.exports = { isQueuedEditorAnnotationMessage };
