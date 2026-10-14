type Cleanup = () => void;

type AnnotationEditorAnchorSyncDependencies = {
  windowLike: any;
  createTargetMap: (rootHost: any) => Map<any, any>;
  findComment: (comments: any[], commentId: any) => any;
  resolveCommentElement: (comment: any, targets: Map<any, any>) => any;
  projectCommentAnchor: (comment: any, element: any, zoom: number) => any;
  serializeEditorAnchor: (editor: any, zoom: number, viewportScale: number) => any;
  projectEditAnchor: (editor: any, comments: any[], targets: Map<any, any>, zoom: number) => any;
  normalizeEditAnchor: (anchorState: any, targets: Map<any, any>) => any;
  resolveEditorElement: (anchor: any, targets: Map<any, any>) => any;
  targetsEqual: (left: any, right: any) => boolean;
  textAnchorsEqual: (left: any, right: any) => boolean;
  sendAnchorUpdate: (target: any, anchorState: any) => void;
  refreshViewport: () => void;
  updateEditorState: (update: (state: any) => any) => void;
  clearCreateHover: () => void;
  observeFrames: (install: (documentLike: any, windowLike: any) => Cleanup) => Cleanup;
  observeScrollContainers: (windowLike: any, anchors: any[], onChange: () => void) => Cleanup;
  observeTextAnchors: (anchors: any[], onChange: () => void) => Cleanup;
};

type AnnotationEditorAnchorSyncInput = {
  editor: any;
  previewCommentId: any;
  comments: any[];
  rootHost: any;
  zoom: number;
  viewportScale: number;
};

/** Owns editor anchor projection plus its viewport, frame, and text-anchor observation lifecycle. */
function createAnnotationEditorAnchorSyncController(dependencies: AnnotationEditorAnchorSyncDependencies) {
  const install = (input: AnnotationEditorAnchorSyncInput): Cleanup => {
    const { editor, previewCommentId, comments, rootHost, zoom, viewportScale } = input;
    if ((editor == null && previewCommentId == null) || editor?.anchor.type === `virtual`) return () => {};

    const refresh = () => {
      const previewTarget = previewCommentId == null ? null : { mode: `edit`, commentId: previewCommentId };
      const target = editor?.target ?? previewTarget;
      if (target == null) return;

      const targets = dependencies.createTargetMap(rootHost);
      let anchorState;
      if (editor == null) {
        const comment = dependencies.findComment(comments, previewCommentId);
        if (comment == null) return;
        const element = dependencies.resolveCommentElement(comment, targets) ?? null;
        if (element != null) targets.set(comment.id, element);
        anchorState = dependencies.projectCommentAnchor(comment, element, zoom);
      } else if (editor.target.mode === `create` || editor.target.mode === `design`) {
        anchorState = dependencies.serializeEditorAnchor(editor, zoom, viewportScale);
      } else {
        anchorState = dependencies.projectEditAnchor(editor, comments, targets, zoom);
        if (anchorState != null) anchorState = dependencies.normalizeEditAnchor(anchorState, targets);
      }

      if (anchorState == null && editor == null) return;
      dependencies.sendAnchorUpdate(target, anchorState);
      dependencies.refreshViewport();

      if (editor?.anchor.type === `text` && anchorState?.anchor.kind === `text`) {
        const nextTextAnchor = anchorState.anchor;
        dependencies.updateEditorState((state) =>
          state?.anchor.type !== `text` || dependencies.textAnchorsEqual(state.anchor.value, nextTextAnchor)
            ? state
            : { ...state, anchor: { ...state.anchor, value: nextTextAnchor } },
        );
      }

      if (anchorState == null || editor == null) {
        if (editor == null) return;
        dependencies.updateEditorState((state) =>
          state == null ||
          !dependencies.targetsEqual(state.target, editor.target) ||
          state.anchor.type !== `element` ||
          state.anchor.element == null
            ? state
            : { ...state, anchor: { ...state.anchor, element: null } },
        );
        return;
      }

      if (editor.target.mode !== `edit`) return;
      const element = dependencies.resolveEditorElement(editor.anchor, targets);
      dependencies.updateEditorState((state) =>
        state == null ||
        !dependencies.targetsEqual(state.target, editor.target) ||
        state.anchor.type !== `element` ||
        state.anchor.element === element
          ? state
          : { ...state, anchor: { ...state.anchor, element } },
      );
    };

    const onResize = () => refresh();
    const onScroll = () => {
      if (editor?.target.mode === `create` && editor.anchor.type !== `text`) dependencies.clearCreateHover();
      refresh();
    };
    const observedAnchors =
      editor == null
        ? []
        : editor.anchor.type === `text`
          ? [editor.anchor.value]
          : [editor.anchor.value, ...editor.anchor.additionalSelections.map((selection: any) => selection.anchor)];

    const viewport = dependencies.windowLike.visualViewport;
    viewport?.addEventListener(`resize`, onResize);
    viewport?.addEventListener(`scroll`, onScroll);
    const cleanupFrames = dependencies.observeFrames((documentLike, windowLike) => {
      windowLike.addEventListener(`resize`, onResize);
      windowLike.addEventListener(`scroll`, onScroll);
      documentLike.addEventListener(`scroll`, onScroll, true);
      const cleanupScrollContainers = dependencies.observeScrollContainers(windowLike, observedAnchors, onScroll);
      return () => {
        windowLike.removeEventListener(`resize`, onResize);
        windowLike.removeEventListener(`scroll`, onScroll);
        documentLike.removeEventListener(`scroll`, onScroll, true);
        cleanupScrollContainers();
      };
    });
    const cleanupTextAnchors =
      editor?.anchor.type === `text`
        ? dependencies.observeTextAnchors([editor.anchor.value], refresh)
        : () => {};
    refresh();

    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      viewport?.removeEventListener(`resize`, onResize);
      viewport?.removeEventListener(`scroll`, onScroll);
      cleanupFrames();
      cleanupTextAnchors();
    };
  };

  return { install };
}

export { createAnnotationEditorAnchorSyncController };
if (typeof module !== `undefined`) module.exports = { createAnnotationEditorAnchorSyncController };
