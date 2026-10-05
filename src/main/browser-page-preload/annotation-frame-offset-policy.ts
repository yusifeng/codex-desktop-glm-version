type AnnotationFrameOffsetDependencies = {
  currentWindow: any;
  getFrameElement: (windowLike: any) => any;
  isFrameElement: (value: any) => boolean;
  getParentWindow: (frameElement: any) => any;
  getRect: (frameElement: any) => { left: number; top: number };
  getParentOffset: (windowLike: any) => { x: number; y: number };
};

function getAnnotationFrameOffset(windowLike: any, deps: AnnotationFrameOffsetDependencies): { x: number; y: number } {
  if (windowLike === deps.currentWindow) return { x: 0, y: 0 };
  const frameElement = deps.getFrameElement(windowLike);
  if (!deps.isFrameElement(frameElement)) return { x: 0, y: 0 };
  const parentWindow = deps.getParentWindow(frameElement);
  if (parentWindow == null) return { x: 0, y: 0 };
  const parentOffset = deps.getParentOffset(parentWindow);
  const rect = deps.getRect(frameElement);
  return { x: parentOffset.x + rect.left, y: parentOffset.y + rect.top };
}

export { getAnnotationFrameOffset };
if (typeof module !== `undefined`) module.exports = { getAnnotationFrameOffset };
