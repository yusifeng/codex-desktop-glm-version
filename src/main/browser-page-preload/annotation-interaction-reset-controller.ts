type AnnotationInteractionResetDependencies = {
  closePreview: (commentId: string) => void;
  resetModifier: () => void;
  clearPointer: () => void;
  clearTransient: () => void;
  clearPreparedSelection: () => void;
  clearHover: () => void;
  clearSelectionHover: () => void;
  clearPreview: () => void;
  clearSelectionSuppression: () => void;
  clearCapturedPoint: () => void;
  clearEditorState: () => void;
  nextInteractionGeneration: () => void;
  clearViewportSelection: () => void;
  clearDragState: () => void;
};

/** Resets the complete annotation interaction/editor lifecycle in the original side-effect order. */
function createAnnotationInteractionResetController(dependencies: AnnotationInteractionResetDependencies) {
  let disposed = false;
  const reset = (previewCommentId: string | null) => {
    if (disposed) return false;
    if (previewCommentId != null) dependencies.closePreview(previewCommentId);
    dependencies.resetModifier();
    dependencies.clearPointer();
    dependencies.clearTransient();
    dependencies.clearPreparedSelection();
    dependencies.clearHover();
    dependencies.clearSelectionHover();
    dependencies.clearPreview();
    dependencies.clearSelectionSuppression();
    dependencies.clearCapturedPoint();
    dependencies.clearEditorState();
    dependencies.nextInteractionGeneration();
    dependencies.clearViewportSelection();
    dependencies.clearDragState();
    return true;
  };
  const dispose = () => { disposed = true; };
  return { reset, dispose };
}

export { createAnnotationInteractionResetController };
if (typeof module !== `undefined`) module.exports = { createAnnotationInteractionResetController };
