type AnnotationEditEditorDependencies = {
  createTargetMap: (rootHost: any) => Map<any, any>;
  findComment: (comments: any[], request: any) => any;
  projectComment: (comment: any, anchor: any, index: number) => any;
  resolveTarget: (anchor: any, preferredId: string | undefined, targets: Map<any, any>) => any;
  applyDesignChange: (target: any, designId: string) => void;
  projectAnchor: (commentState: any, target: any, zoom: number) => any;
  projectDraftDesign: (designChange: any) => any;
  projectElementDesign: (target: any, anchorState: any, controls: any, designChange: any) => any;
  buildEditorAnchor: (commentState: any, target: any, targets: Map<any, any>) => any;
  closePreview: (commentId: string) => void;
  openEditor: (payload: any) => void;
  refreshViewport: () => void;
  setEditorState: (state: any) => void;
  clearPreview: () => void;
  rememberTarget: (id: string, target: any) => void;
};

type AnnotationEditEditorContext = {
  comments: any[];
  rootHost: any;
  previewCommentId: string | null;
  canUseSiteAnnotationApi: boolean;
  zoom: number;
  getAnnotationControls?: (target: any) => any;
};

/** Reopens an existing comment editor while preserving target/preview/viewport side-effect order. */
function createAnnotationEditEditorController(dependencies: AnnotationEditEditorDependencies) {
  let disposed = false;

  const open = (
    request: any,
    anchorOverride: any,
    selectionIndex: number,
    context: AnnotationEditEditorContext,
  ) => {
    if (disposed) return false;
    const anchor = anchorOverride ?? request.anchor;
    const targets = dependencies.createTargetMap(context.rootHost);
    const comment = dependencies.findComment(context.comments, request) ?? request;
    const commentState = dependencies.projectComment(comment, anchor, selectionIndex);
    const isPrimary = selectionIndex === 0;
    const target = dependencies.resolveTarget(anchor, isPrimary ? comment.id : undefined, targets) ?? null;
    if (target != null) {
      if (isPrimary) targets.set(comment.id, target);
      if (commentState.designChange != null) dependencies.applyDesignChange(target, commentState.designChange.id);
    }
    if (context.previewCommentId != null) dependencies.closePreview(context.previewCommentId);
    const anchorState = dependencies.projectAnchor(commentState, target, context.zoom);
    const designState =
      commentState.designChange != null && target == null
        ? dependencies.projectDraftDesign(commentState.designChange)
        : target == null || anchorState.anchor.kind !== `element`
          ? undefined
          : dependencies.projectElementDesign(
              target,
              anchorState,
              context.canUseSiteAnnotationApi ? context.getAnnotationControls?.(target) : undefined,
              commentState.designChange,
            );
    if (designState != null && target != null) {
      if (
        context.canUseSiteAnnotationApi &&
        (commentState.designChange == null ||
          (commentState.designChange.anchor.kind === `element` &&
            anchorState.anchor.kind === `element` &&
            commentState.designChange.anchor.runtimeElementId != null &&
            commentState.designChange.anchor.runtimeElementId === anchorState.anchor.runtimeElementId))
      ) {
        dependencies.rememberTarget(designState.id, target);
      }
      targets.set(designState.id, target);
    }
    dependencies.openEditor({
      type: `browser-sidebar-runtime-open-editor`,
      target: { mode: `edit`, commentId: comment.id },
      anchorState,
      designEditorState: designState,
    });
    dependencies.refreshViewport();
    dependencies.setEditorState({
      target: { mode: `edit`, commentId: comment.id },
      anchor: dependencies.buildEditorAnchor({ ...commentState, anchor: anchorState.anchor }, target, targets),
    });
    dependencies.clearPreview();
    return true;
  };

  const dispose = () => {
    disposed = true;
  };

  return { open, dispose };
}

export { createAnnotationEditEditorController };
if (typeof module !== `undefined`) module.exports = { createAnnotationEditEditorController };
