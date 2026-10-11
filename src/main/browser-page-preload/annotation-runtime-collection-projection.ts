type AnnotationRuntimeCollectionProjectionDependencies = {
  isCurrentPage: (comment: any) => boolean;
  hasComments: (comments: any[]) => boolean;
  emptyCollection: any[];
};

/** Project the comment/design collections consumed by the annotation React runtime. */
function projectAnnotationRuntimeCollections(
  comments: any[],
  {
    activeDesignChange,
    canUseTweaks,
    isOriginalViewEnabled,
    annotationEditorMode,
  }: {
    activeDesignChange?: any;
    canUseTweaks: boolean;
    isOriginalViewEnabled: boolean;
    annotationEditorMode?: unknown;
  },
  dependencies: AnnotationRuntimeCollectionProjectionDependencies,
) {
  const commentIndex = new Map(comments.map((comment, index) => [comment.id, index + 1]));
  const pageComments = comments.filter(dependencies.isCurrentPage);
  const designChanges = comments.flatMap((comment) =>
    comment.designChange == null ? [] : [comment.designChange],
  );
  const mergedDesignChanges = canUseTweaks
    ? activeDesignChange == null
      ? designChanges
      : [...designChanges.filter((change) => change.id !== activeDesignChange.id), activeDesignChange]
    : dependencies.emptyCollection;
  const visibleDesignChanges = isOriginalViewEnabled ? dependencies.emptyCollection : mergedDesignChanges;
  const hasComments = dependencies.hasComments(comments);

  return {
    commentIndex,
    pageComments,
    designChanges,
    mergedDesignChanges,
    visibleDesignChanges,
    hasComments,
    isDesignMode: canUseTweaks && hasComments && annotationEditorMode === `design`,
  };
}

export { projectAnnotationRuntimeCollections };
if (typeof module !== `undefined`) module.exports = { projectAnnotationRuntimeCollections };
