/**
 * Projects resolved annotation selections into the overlay's display shape.
 *
 * The caller owns DOM/frame resolution and geometry; this boundary only keeps
 * selection ordering, clipping, CSS class selection, and source indexes in one
 * testable policy.
 */
export type AnnotationDisplaySelectionDependencies = {
  resolveSelection: (selection: any, viewportSize: any) => any;
  resolveLiveElementRect: (element: any) => { rect?: any } | null;
  getRect: (anchor: any) => any;
  clipRect: (anchor: any, rect: any, element?: any) => any;
  getClassName: (anchor: any, rect: any, viewportWidth: number, viewportHeight: number) => string;
  isPageAnnotation: (anchor: any) => boolean;
};

export function projectAnnotationDisplaySelections(
  selections: any[],
  viewport: { width: number; height: number },
  options: { clipToVisibleArea?: boolean; selectionIndexOffset?: number; viewportSize?: any } = {},
  deps: AnnotationDisplaySelectionDependencies,
) {
  const clipToVisibleArea = options.clipToVisibleArea === true;
  const selectionIndexOffset = options.selectionIndexOffset ?? 0;
  return selections.flatMap((selection: any, sourceIndex: number) => {
    const anchor = deps.resolveSelection(selection, options.viewportSize);
    const live = anchor.kind === `element` && selection.liveElement != null
      ? deps.resolveLiveElementRect(selection.liveElement)
      : null;
    const rect = live?.rect ?? deps.getRect(anchor);
    const clipped = rect == null ? null : clipToVisibleArea ? deps.clipRect(anchor, rect, selection.liveElement) : rect;
    if (clipped == null) return [];
    return [{
      borderRadius: live?.borderRadius,
      className: deps.getClassName(anchor, rect, viewport.width, viewport.height),
      isPageAnnotation: deps.isPageAnnotation(anchor),
      key: `${selection.anchor.kind}:${selection.anchor.framePath.join(`>`)}:${selection.anchor.selector ?? selection.anchor.elementPath}:${selection.anchor.rect.x}:${selection.anchor.rect.y}:${sourceIndex}`,
      rect: clipped,
      selectionIndex: selectionIndexOffset + sourceIndex,
    }];
  });
}

if (typeof module !== `undefined`) module.exports = { projectAnnotationDisplaySelections };
