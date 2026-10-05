type FrameChainDependencies = {
  rootWindow: unknown;
  isFrameElement: (value: unknown) => boolean;
  getFrameElement: (windowLike: unknown) => any;
  getOwnerWindow: (element: any) => unknown;
  resolveAnnotationElement: (element: unknown) => unknown;
};
/** Verifies every same-origin frame hop remains stable up to the root window. */
function isStableAnnotationFrameChain(element: any, deps: FrameChainDependencies) {
  let currentWindow = element?.ownerDocument?.defaultView;
  while (currentWindow != null && currentWindow !== deps.rootWindow) {
    const frame = deps.getFrameElement(currentWindow);
    if (!deps.isFrameElement(frame) || deps.resolveAnnotationElement(frame) !== undefined) return false;
    currentWindow = deps.getOwnerWindow(frame);
  }
  return currentWindow === deps.rootWindow;
}
export { isStableAnnotationFrameChain };
if (typeof module !== `undefined`) module.exports = { isStableAnnotationFrameChain };
