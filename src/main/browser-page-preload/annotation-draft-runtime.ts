type DraftAnnotation = {
  id?: string;
  draftAttribute: string;
  anchor: {
    pageUrl: string;
    framePath: string;
    frameUrl?: string;
    kind: string;
    selector?: string;
  };
};

type DraftRuntimeDependencies = {
  currentPageUrl: string;
  resolveFrameDocument: (framePath: string) => unknown;
  isSamePageUrl: (left: string, right: string) => boolean;
  resolveTarget: (documentRef: unknown, annotation: DraftAnnotation) => unknown;
  isConnected: (target: unknown) => boolean;
  getOwnerDocument: (target: unknown) => unknown;
  documentRef: unknown;
};

/** Collects live element targets and the design attributes that belong on each target. */
function collectAnnotationDraftAttributes(
  annotations: DraftAnnotation[],
  targetCache: Map<string, any>,
  dependencies: DraftRuntimeDependencies,
) {
  const attributesByTarget = new Map<any, Set<string>>();
  for (const annotation of annotations) {
    const anchor = annotation.anchor;
    if (
      !dependencies.isSamePageUrl(anchor.pageUrl, dependencies.currentPageUrl) ||
      anchor.kind !== `element` ||
      anchor.selector == null ||
      dependencies.resolveFrameDocument(anchor.framePath) !== dependencies.documentRef
    ) continue;
    const cached = targetCache.get(annotation.id ?? annotation.draftAttribute);
    const target = cached?.isConnected && dependencies.getOwnerDocument(cached) === dependencies.documentRef
      ? cached
      : dependencies.resolveTarget(dependencies.documentRef, annotation);
    if (target == null || !dependencies.isConnected(target) || dependencies.getOwnerDocument(target) !== dependencies.documentRef) continue;
    targetCache.set(annotation.id ?? annotation.draftAttribute, target);
    const attributes = attributesByTarget.get(target) ?? new Set<string>();
    attributes.add(annotation.draftAttribute);
    attributesByTarget.set(target, attributes);
  }
  return attributesByTarget;
}

export { collectAnnotationDraftAttributes };
if (typeof module !== `undefined`) module.exports = { collectAnnotationDraftAttributes };
