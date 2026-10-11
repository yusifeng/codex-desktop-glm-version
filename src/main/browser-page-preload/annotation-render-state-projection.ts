type AnnotationRenderStateDependencies = {
  collectFlexGapOverlays: (property: string | null, editor: any, annotation: any, cache: Map<any, any>) => any[];
};

/** Projects render-only branches around active annotation geometry. */
function projectAnnotationRenderState(
  {
    hasActiveSelection,
    flexGapProperty,
    editor,
    activeAnnotation,
    elementCache,
    showMetadata,
    hoverSnapshot,
    highlightRect,
    selectedComment,
    modifierActive,
    selectedPoint,
    hasLinkedDraftSelection,
    nativeTextSelection,
    hotspots,
  }: {
    hasActiveSelection: boolean;
    flexGapProperty: string | null;
    editor: any;
    activeAnnotation: any;
    elementCache: Map<any, any>;
    showMetadata: boolean;
    hoverSnapshot: any;
    highlightRect: any;
    selectedComment: any;
    modifierActive: boolean;
    selectedPoint: any;
    hasLinkedDraftSelection: boolean;
    nativeTextSelection: boolean;
    hotspots: { add: any; comment: any };
  },
  dependencies: AnnotationRenderStateDependencies,
) {
  const isDraftNonText = editor?.target?.mode === `create` && editor.anchor.type !== `text`;
  const draftHoverSnapshot = !hasActiveSelection && isDraftNonText ? hoverSnapshot : null;
  const isRemoveHover =
    modifierActive && draftHoverSnapshot != null && selectedPoint != null && hasLinkedDraftSelection;
  const mode = nativeTextSelection ? `text` : modifierActive ? `add` : `comment`;
  return {
    flexItemOverlays: hasActiveSelection
      ? []
      : dependencies.collectFlexGapOverlays(flexGapProperty, editor, activeAnnotation, elementCache),
    metadataSnapshot:
      showMetadata && !hasActiveSelection && editor == null && highlightRect == null && selectedComment == null
        ? hoverSnapshot
        : null,
    draftHoverSnapshot,
    isRemoveHover,
    mode,
    hotspot: hotspots[mode === `add` ? `add` : `comment`],
  };
}

export { projectAnnotationRenderState };
if (typeof module !== `undefined`) module.exports = { projectAnnotationRenderState };
