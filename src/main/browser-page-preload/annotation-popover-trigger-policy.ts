function triggerAnnotationPopoverAtPoint(point: { x: number; y: number }, root: any, deps: { hitTest: (x: number, y: number) => any; isOverlay: (element: any) => boolean; open: (root: any, attribute: string) => any; attribute: string }): any {
  const element = deps.hitTest(point.x, point.y);
  if (element == null || deps.isOverlay(element)) return undefined;
  return deps.open(root, deps.attribute);
}

export { triggerAnnotationPopoverAtPoint };
if (typeof module !== `undefined`) module.exports = { triggerAnnotationPopoverAtPoint };
