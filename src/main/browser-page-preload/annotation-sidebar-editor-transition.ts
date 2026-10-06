function reduceAnnotationSidebarEditorTransition(previous: any, message: any): any {
  switch (message.type) {
    case `browser-sidebar-runtime-select-comment`: case `browser-sidebar-runtime-create-comment-at-point`: case `browser-sidebar-runtime-create-comment-from-selection`: case `browser-sidebar-runtime-open-design-editor-at-point`: return message;
    case `browser-sidebar-runtime-restore-editor`: return [`browser-sidebar-runtime-select-comment`, `browser-sidebar-runtime-create-comment-at-point`, `browser-sidebar-runtime-create-comment-from-selection`, `browser-sidebar-runtime-open-design-editor-at-point`].includes(previous?.type) ? previous : message;
    case `browser-sidebar-runtime-close-editor`: return null;
    case `browser-sidebar-runtime-sync`: case `browser-sidebar-runtime-prepare-comment-screenshot`: case `browser-sidebar-runtime-clear-comment-screenshot`: return previous;
  }
}
export { reduceAnnotationSidebarEditorTransition };
if (typeof module !== `undefined`) module.exports = { reduceAnnotationSidebarEditorTransition };
