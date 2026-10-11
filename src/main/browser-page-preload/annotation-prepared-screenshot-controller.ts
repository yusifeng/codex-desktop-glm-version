type AnnotationPreparedScreenshotDependencies = {
  setPreparedComment: (commentId: string | null) => void;
};

/** Owns prepared screenshot selection and clears it when the comment disappears. */
function createAnnotationPreparedScreenshotController(
  dependencies: AnnotationPreparedScreenshotDependencies,
) {
  let preparedCommentId: string | null = null;
  let disposed = false;

  const prepare = (commentId: string) => {
    if (disposed) return false;
    preparedCommentId = commentId;
    dependencies.setPreparedComment(commentId);
    return true;
  };
  const clear = () => {
    if (disposed) return false;
    preparedCommentId = null;
    dependencies.setPreparedComment(null);
    return true;
  };
  const reconcile = (comments: Array<{ id: string }>) => {
    if (disposed || preparedCommentId == null) return false;
    if (comments.some((comment) => comment.id === preparedCommentId)) return false;
    preparedCommentId = null;
    dependencies.setPreparedComment(null);
    return true;
  };
  const dispose = () => {
    disposed = true;
    preparedCommentId = null;
  };

  return { prepare, clear, reconcile, dispose };
}

export { createAnnotationPreparedScreenshotController };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreparedScreenshotController };
