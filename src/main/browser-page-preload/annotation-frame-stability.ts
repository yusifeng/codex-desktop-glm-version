type FrameElement = { ownerDocument?: { defaultView?: unknown } };
type FrameStabilityDependencies = {
  rootWindow: unknown;
  resolveAnnotationElement: (element: unknown) => unknown;
  isFrameElement: (value: unknown) => boolean;
  getFrameElement: (windowLike: unknown) => FrameElement | null;
  getOwnerWindow: (element: FrameElement) => unknown;
};

function isStableAnnotationFrame(element: unknown, dependencies: FrameStabilityDependencies): boolean {
  if (dependencies.resolveAnnotationElement(element) !== element) return false;
  let currentWindow = (element as FrameElement | null)?.ownerDocument?.defaultView;
  while (currentWindow != null && currentWindow !== dependencies.rootWindow) {
    const frame = dependencies.getFrameElement(currentWindow);
    if (!dependencies.isFrameElement(frame) || dependencies.resolveAnnotationElement(frame) !== undefined)
      return false;
    currentWindow = dependencies.getOwnerWindow(frame);
  }
  return currentWindow === dependencies.rootWindow;
}

export { isStableAnnotationFrame };
if (typeof module !== `undefined`) module.exports = { isStableAnnotationFrame };
