function installAnnotationScrollListeners(frameWindow: any, anchors: any[], onScroll: () => void, deps: { getFrameWindow: (framePath: any) => any; resolveElement: (documentLike: any, selector: string) => any; addListener: (element: any, type: string, listener: () => void) => void; removeListener: (element: any, type: string, listener: () => void) => void }): () => void {
  const containers = new Set<any>();
  for (const anchor of anchors) {
    if (anchor.scrollContainers == null || deps.getFrameWindow(anchor.framePath) !== frameWindow) continue;
    for (const descriptor of anchor.scrollContainers) { const element = deps.resolveElement(frameWindow.document, descriptor.selector); if (element != null) containers.add(element); }
  }
  for (const element of containers) deps.addListener(element, `scroll`, onScroll);
  return () => { for (const element of containers) deps.removeListener(element, `scroll`, onScroll); };
}
export { installAnnotationScrollListeners };
if (typeof module !== `undefined`) module.exports = { installAnnotationScrollListeners };
