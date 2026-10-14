type AnnotationCurrentPageTargetProjectionDependencies = {
  projectCollections: (comments: any[], options: any, dependencies: any) => any;
  isCurrentPage: (comment: any) => boolean;
  hasComments: (comments: any[]) => boolean;
  emptyCollection: any[];
  getElementCache: (rootHost: any) => any;
  projectCommentTarget: (comment: any, elementCache: any, isPreview: boolean, observedAnchor: any) => any;
  refreshDesignTarget: (change: any, elementCache: any) => any;
};

/** Projects the page-scoped comment and design targets consumed by the annotation runtime. */
function projectAnnotationCurrentPageTargets(
  comments: any[],
  {
    activeDesignChange,
    canUseTweaks,
    isOriginalViewEnabled,
    annotationEditorMode,
    rootHost,
    previewCommentId,
    observedTextAnchors,
  }: any,
  dependencies: AnnotationCurrentPageTargetProjectionDependencies,
) {
  const collectionState = dependencies.projectCollections(
    comments,
    { activeDesignChange, canUseTweaks, isOriginalViewEnabled, annotationEditorMode },
    {
      isCurrentPage: dependencies.isCurrentPage,
      hasComments: dependencies.hasComments,
      emptyCollection: dependencies.emptyCollection,
    },
  );
  const elementCache = dependencies.getElementCache(rootHost);
  const visiblePageComments = collectionState.pageComments.flatMap((comment: any) => {
    const observedAnchor = observedTextAnchors.get(comment.id);
    const target = dependencies.projectCommentTarget(
      comment,
      elementCache,
      comment.id === previewCommentId,
      observedAnchor?.sourceAnchor === comment.anchor ? observedAnchor.value : null,
    );
    return target == null ? [] : [target];
  });
  const visibleDesignTargets = collectionState.visibleDesignChanges.flatMap((change: any) => {
    const target = dependencies.refreshDesignTarget(change, elementCache);
    return target == null ? [] : [target];
  });
  const anchors = collectionState.pageComments.flatMap((comment: any) => [
    comment.anchor,
    ...(comment.additionalAnchors ?? []),
  ]);

  return {
    ...collectionState,
    elementCache,
    visiblePageComments,
    visibleDesignTargets,
    observeDocumentScroll: visiblePageComments.some((comment: any) =>
      [comment.anchor, ...(comment.additionalAnchors ?? [])].some((anchor: any) => !anchor.isFixed),
    ),
    observeMutations: anchors.some((anchor: any) => anchor.kind === `element` && anchor.selector != null),
  };
}

export { projectAnnotationCurrentPageTargets };
if (typeof module !== `undefined`) module.exports = { projectAnnotationCurrentPageTargets };
