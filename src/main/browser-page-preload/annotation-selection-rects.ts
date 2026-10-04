/** Resolves text-anchor selection rects into viewport geometry, dropping unavailable frames. */
export function resolveAnnotationSelectionRects(
  anchor: { selectionRects: any[] },
  deps: { anchorToViewportRect: (value: any) => any },
) {
  return anchor.selectionRects.flatMap((rect: any) => {
    const viewportRect = deps.anchorToViewportRect({ ...anchor, rect });
    return viewportRect == null ? [] : [viewportRect];
  });
}

if (typeof module !== `undefined`) module.exports = { resolveAnnotationSelectionRects };
