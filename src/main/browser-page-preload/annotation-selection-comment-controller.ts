type AnnotationSelectionCommentDependencies = {
  focusEditor: () => void;
  getPreparedSelection: () => any;
  clearPreparedSelection: () => void;
  getCurrentSelection: () => any;
  clearSelection: () => void;
  retryAtPoint: (point: any) => boolean;
  openFromSelection: (selection: any) => boolean;
};

/** Coordinates selection-backed comment creation and its fallback point retry. */
function createAnnotationSelectionCommentController(
  dependencies: AnnotationSelectionCommentDependencies,
) {
  let disposed = false;

  const create = (message: any, isEditorOpen: boolean) => {
    if (disposed) return false;
    if (isEditorOpen) {
      dependencies.focusEditor();
      return true;
    }
    const prepared = dependencies.getPreparedSelection();
    dependencies.clearPreparedSelection();
    const selection =
      (prepared?.anchor?.kind === `text` ? prepared : null) ?? dependencies.getCurrentSelection();
    if (selection == null) {
      dependencies.clearSelection();
      return message.fallbackViewportPoint != null
        ? dependencies.retryAtPoint(message.fallbackViewportPoint)
        : false;
    }
    return dependencies.openFromSelection(selection);
  };

  const dispose = () => {
    disposed = true;
  };

  return { create, dispose };
}

export { createAnnotationSelectionCommentController };
if (typeof module !== `undefined`) module.exports = { createAnnotationSelectionCommentController };
