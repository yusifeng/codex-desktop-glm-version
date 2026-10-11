type FrameHitTestDependencies = {
  getElementFromPoint: (windowLike: any, x: number, y: number) => any;
  getShadowRoot: (element: any) => any;
  getShadowElementFromPoint: (shadowRoot: any, x: number, y: number) => any;
  isElement: (value: any) => boolean;
  isFrameElement: (value: any) => boolean;
  resolveFrameWindow: (frame: any) => any;
  getFrameRect: (frame: any) => { left: number; top: number };
};
function resolveAnnotationFrameHit(windowLike: any, x: number, y: number, onFrame: ((frame: any, point: { x: number; y: number }) => any) | undefined, denied: symbol, deps: FrameHitTestDependencies): any {
  let element = deps.getElementFromPoint(windowLike, x, y);
  if (element == null) return null;
  for (;;) {
    const shadowRoot = deps.getShadowRoot(element);
    if (shadowRoot == null) break;
    const shadowElement = deps.getShadowElementFromPoint(shadowRoot, x, y);
    if (!deps.isElement(shadowElement) || shadowElement === element) break;
    element = shadowElement;
  }
  if (deps.isFrameElement(element)) {
    const frameResult = onFrame?.(element, { x, y });
    if (frameResult !== undefined) return frameResult ?? denied;
    const frameWindow = deps.resolveFrameWindow(element);
    if (frameWindow != null) {
      const rect = deps.getFrameRect(element);
      const nested = resolveAnnotationFrameHit(frameWindow, x - rect.left, y - rect.top, onFrame, denied, deps);
      if (nested != null) return nested;
    }
  }
  return element;
}
export { resolveAnnotationFrameHit };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationFrameHit };
