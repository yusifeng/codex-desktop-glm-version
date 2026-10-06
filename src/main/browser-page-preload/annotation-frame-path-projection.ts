function projectAnnotationFramePath(windowLike: any, deps: { rootWindow: any; getFrameElement: (windowLike: any) => any; isIframe: (value: any) => boolean; getSelector: (element: any) => string | null; getOwnerWindow: (element: any) => any }): string[] | null {
  const path: string[] = [];
  let current = windowLike;
  while (current !== deps.rootWindow) {
    const frame = deps.getFrameElement(current);
    if (!deps.isIframe(frame)) return null;
    const selector = deps.getSelector(frame);
    if (selector == null) return null;
    path.unshift(selector);
    const parentWindow = deps.getOwnerWindow(frame);
    if (parentWindow == null) return null;
    current = parentWindow;
  }
  return path;
}
export { projectAnnotationFramePath };
if (typeof module !== `undefined`) module.exports = { projectAnnotationFramePath };
