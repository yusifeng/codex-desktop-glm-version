type AnnotationCommentPreviewDependencies = {
  createTargetMap: (rootHost: any) => Map<any, any>;
  findComment: (comments: any[], request: any) => any;
  resolveTarget: (anchor: any, preferredId: string | undefined, targets: Map<any, any>) => any;
  projectComment: (comment: any, anchor: any, index: number) => any;
  projectAnchor: (commentState: any, target: any, zoom: number) => any;
  setPreviewComment: (commentId: string) => void;
  refreshViewport: () => void;
  openPreview: (payload: any) => void;
};

/** Opens an annotation comment preview while preserving anchor resolution and viewport refresh order. */
function createAnnotationCommentPreviewController(dependencies: AnnotationCommentPreviewDependencies) {
  let disposed = false;

  const open = (
    request: any,
    anchor: any,
    selectionIndex: number,
    context: { comments: any[]; rootHost: any; zoom: number },
  ) => {
    if (disposed) return false;
    const targets = dependencies.createTargetMap(context.rootHost);
    const comment = dependencies.findComment(context.comments, request) ?? request;
    const isPrimary = selectionIndex === 0;
    const target = dependencies.resolveTarget(anchor, isPrimary ? comment.id : undefined, targets) ?? null;
    if (target != null && isPrimary) targets.set(comment.id, target);
    dependencies.setPreviewComment(comment.id);
    dependencies.refreshViewport();
    const anchorState = dependencies.projectAnchor(
      dependencies.projectComment(comment, anchor, selectionIndex),
      target,
      context.zoom,
    );
    dependencies.openPreview({
      type: `browser-sidebar-runtime-open-comment-preview`,
      commentId: comment.id,
      anchorState,
    });
    return true;
  };

  const dispose = () => {
    disposed = true;
  };

  return { open, dispose };
}

export { createAnnotationCommentPreviewController };
if (typeof module !== `undefined`) module.exports = { createAnnotationCommentPreviewController };
