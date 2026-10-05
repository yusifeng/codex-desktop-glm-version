function getAnnotationScrollContainerOffset(anchor: any, documentLike: any, deps: { resolveSelector: (documentLike: any, selector: string) => any; isElement: (value: any) => boolean; getScrollLeft: (element: any) => number; getScrollTop: (element: any) => number }): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const container of anchor?.scrollContainers ?? []) {
    const element = deps.resolveSelector(documentLike, container.selector);
    if (deps.isElement(element)) {
      x += deps.getScrollLeft(element) - container.scrollLeft;
      y += deps.getScrollTop(element) - container.scrollTop;
    }
  }
  return { x, y };
}

export { getAnnotationScrollContainerOffset };
if (typeof module !== `undefined`) module.exports = { getAnnotationScrollContainerOffset };
