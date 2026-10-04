type ScrollDelta = { x: number; y: number };
type ScrollableElement = { scrollTop: number; scrollLeft: number; clientHeight: number; clientWidth: number; scrollHeight: number; scrollWidth: number };

function findScrollableAnnotationAncestor(start: ScrollableElement | null, delta: ScrollDelta, documentRoot: { body: unknown; documentElement: unknown }, parentOf: (element: ScrollableElement) => ScrollableElement | null, getComputedStyle: (element: ScrollableElement) => { overflowX: string; overflowY: string }, isScrollableOverflow: (value: string) => boolean, canScrollAxis: (delta: number, offset: number, viewport: number, extent: number) => boolean): ScrollableElement | null {
  let current = start;
  while (current != null) {
    const style = getComputedStyle(current);
    if ((isScrollableOverflow(style.overflowY) && canScrollAxis(delta.y, current.scrollTop, current.clientHeight, current.scrollHeight)) || (isScrollableOverflow(style.overflowX) && canScrollAxis(delta.x, current.scrollLeft, current.clientWidth, current.scrollWidth))) return current;
    if (current === documentRoot.body || current === documentRoot.documentElement) return null;
    current = parentOf(current);
  }
  return null;
}

export { findScrollableAnnotationAncestor };
if (typeof module !== `undefined`) module.exports = { findScrollableAnnotationAncestor };
