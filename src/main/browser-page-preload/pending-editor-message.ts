type EditorMessage = { type: string } & Record<string, unknown>;

/** Keeps the latest editor-opening message until the sidebar runtime consumes it. */
function reducePendingEditorMessage(current: EditorMessage | null | undefined, message: EditorMessage): EditorMessage | null | undefined {
  switch (message.type) {
    case `browser-sidebar-runtime-select-comment`:
    case `browser-sidebar-runtime-create-comment-at-point`:
    case `browser-sidebar-runtime-create-comment-from-selection`:
    case `browser-sidebar-runtime-open-design-editor-at-point`:
      return message;
    case `browser-sidebar-runtime-restore-editor`:
      return current?.type === `browser-sidebar-runtime-select-comment` ||
        current?.type === `browser-sidebar-runtime-create-comment-at-point` ||
        current?.type === `browser-sidebar-runtime-create-comment-from-selection` ||
        current?.type === `browser-sidebar-runtime-open-design-editor-at-point`
        ? current
        : message;
    case `browser-sidebar-runtime-close-editor`:
      return null;
    case `browser-sidebar-runtime-sync`:
    case `browser-sidebar-runtime-prepare-comment-screenshot`:
    case `browser-sidebar-runtime-clear-comment-screenshot`:
      return current;
  }
  return undefined;
}

export { reducePendingEditorMessage };
if (typeof module !== `undefined`) module.exports = { reducePendingEditorMessage };
