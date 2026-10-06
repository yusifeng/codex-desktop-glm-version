function getAnnotationVisibleElementRect(element: any, deps: { isConnected: (element: any) => boolean; isVisible: (element: any) => boolean; getRect: (element: any) => any; getFrameOffset: (element: any) => { x: number; y: number } }): any {
  if (!deps.isConnected(element) || !deps.isVisible(element)) return null;
  const rect = deps.getRect(element);
  if (rect.width <= 0 || rect.height <= 0) return null;
  const offset = deps.getFrameOffset(element);
  return { x: rect.left + offset.x, y: rect.top + offset.y, width: rect.width, height: rect.height };
}
export { getAnnotationVisibleElementRect };
if (typeof module !== `undefined`) module.exports = { getAnnotationVisibleElementRect };
