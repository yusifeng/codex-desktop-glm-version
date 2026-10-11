type AnnotationPointScrollContainerDependencies = {
  getElementFromPoint: (windowLike: any, point: { x: number; y: number }) => any;
  isElement: (value: any) => boolean;
  discover: (element: any, options: { includeElement: boolean }) => any[];
};

function collectAnnotationPointScrollContainers(windowLike: any, point: { x: number; y: number }, deps: AnnotationPointScrollContainerDependencies): any[] {
  const element = deps.getElementFromPoint(windowLike, point);
  return deps.isElement(element) ? deps.discover(element, { includeElement: true }) : [];
}

export { collectAnnotationPointScrollContainers };
if (typeof module !== `undefined`) module.exports = { collectAnnotationPointScrollContainers };
