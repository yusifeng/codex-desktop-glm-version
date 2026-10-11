type AnnotationTextPreviewStateDependencies = {
  resolveTextAnchor: (anchor: any) => any;
  resolveSelectionRects: (anchor: any) => any[];
};

/** Choose and project the text anchor/rects shown by the annotation preview. */
function projectAnnotationTextPreviewState(
  {
    active,
    hasActiveSelection,
    draft,
    isSuspended,
    areMarkersVisible,
    selectedComment,
  }: {
    active: any;
    hasActiveSelection: boolean;
    draft: any;
    isSuspended: boolean;
    areMarkersVisible: boolean;
    selectedComment: any;
  },
  dependencies: AnnotationTextPreviewStateDependencies,
) {
  let anchor = null;
  if (hasActiveSelection && active?.annotation.anchor.kind === `text`) {
    anchor = active.annotation.anchor;
  } else if (!hasActiveSelection && !isSuspended && draft?.anchor.type === `text`) {
    anchor = draft.anchor.value;
  } else if (
    !hasActiveSelection &&
    !isSuspended &&
    areMarkersVisible &&
    selectedComment?.anchor.kind === `text`
  ) {
    anchor = selectedComment.anchor;
  }
  const resolvedAnchor = anchor == null ? null : dependencies.resolveTextAnchor(anchor);
  const selectionRects = anchor == null ? [] : dependencies.resolveSelectionRects(anchor);
  return {
    anchor,
    resolvedAnchor,
    selectionRects: resolvedAnchor == null ? selectionRects : [],
  };
}

export { projectAnnotationTextPreviewState };
if (typeof module !== `undefined`) module.exports = { projectAnnotationTextPreviewState };
