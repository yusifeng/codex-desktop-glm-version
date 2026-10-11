type AnnotationCommentPreviewCloseDependencies = {
  closePreview: (commentId: string) => void;
  clearPreview: () => void;
};

/** Closes the active comment preview through host IPC and local state cleanup. */
function createAnnotationCommentPreviewCloseController(dependencies: AnnotationCommentPreviewCloseDependencies) {
  let disposed = false;
  const close = (commentId: string | null) => {
    if (disposed || commentId == null) return false;
    dependencies.closePreview(commentId);
    dependencies.clearPreview();
    return true;
  };
  const dispose = () => { disposed = true; };
  return { close, dispose };
}

export { createAnnotationCommentPreviewCloseController };
if (typeof module !== `undefined`) module.exports = { createAnnotationCommentPreviewCloseController };
