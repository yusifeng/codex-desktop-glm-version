/** Resolve annotation anchors for display while preserving source indexes. */
export type AnnotationDisplayAnchorDependencies = {
  getViewportSize: (annotation: any) => any;
  resolveElement: (anchor: any, annotationId: string | undefined, cache: Map<any, any>) => any;
  isCurrentPage: (pageUrl: string) => boolean;
  refreshElementAnchor: (element: any, anchor: any, viewportSize: any, markerPoint?: any) => any;
};

export function resolveAnnotationDisplayAnchors(
  annotation: any,
  cache: Map<any, any>,
  allowMissingSelectors = false,
  textAnchor: any = null,
  deps: AnnotationDisplayAnchorDependencies,
) {
  if (annotation.anchor.kind === `text`) {
    return projectAnnotationTextDisplay(annotation, textAnchor);
  }
  const viewportSize = deps.getViewportSize(annotation);
  const resolved = [annotation.anchor, ...(annotation.additionalAnchors ?? [])].flatMap((anchor: any, sourceIndex: number) => {
    if (anchor.kind !== `element`) return [{ anchor, sourceIndex }];
    const element = deps.resolveElement(anchor, sourceIndex === 0 ? annotation.id : undefined, cache);
    if (element == null) {
      return !allowMissingSelectors && anchor.selector != null && deps.isCurrentPage(anchor.pageUrl)
        ? []
        : [{ anchor, sourceIndex }];
    }
    if (sourceIndex === 0) cache.set(annotation.id, element);
    return [{
      anchor: deps.refreshElementAnchor(
        element,
        anchor,
        viewportSize,
        sourceIndex === 0 ? annotation.markerViewportPoint : undefined,
      ),
      sourceIndex,
    }];
  });
  const [primary, ...additional] = resolved;
  if (primary == null) return null;
  return {
    ...annotation,
    anchor: primary.anchor,
    additionalAnchors: additional.length === 0 ? undefined : additional.map(({ anchor }: any) => anchor),
    markerViewportPoint: primary.sourceIndex === 0 ? annotation.markerViewportPoint : undefined,
    markerViewportSize: viewportSize,
    selectionSourceIndexes: resolved.map(({ sourceIndex }: any) => sourceIndex),
  };
}

if (typeof module !== `undefined`) module.exports = { resolveAnnotationDisplayAnchors };
import { projectAnnotationTextDisplay } from "./annotation-text-display-projection";
