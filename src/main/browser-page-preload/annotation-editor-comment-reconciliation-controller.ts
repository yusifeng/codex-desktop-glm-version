type AnnotationEditorCommentReconciliationDependencies = {
  updateEditorState: (update: (state: any) => any) => void;
};

/** Reconciles an open comment editor against the latest host comment collection. */
function createAnnotationEditorCommentReconciliationController(
  dependencies: AnnotationEditorCommentReconciliationDependencies,
) {
  let disposed = false;

  const reconcile = (comments: Array<{ id: string }>) => {
    if (disposed) return false;
    dependencies.updateEditorState((state) => {
      if (state == null) return state;
      const target = state.target;
      return target.mode === `design` || !(`commentId` in target) || comments.some((comment) => comment.id === target.commentId)
        ? state
        : null;
    });
    return true;
  };
  const dispose = () => {
    disposed = true;
  };

  return { reconcile, dispose };
}

export { createAnnotationEditorCommentReconciliationController };
if (typeof module !== `undefined`) module.exports = { createAnnotationEditorCommentReconciliationController };
