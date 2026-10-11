type AnnotationSiteRequestDispatchDependencies = {
  resolveTextAnchor: (range: any) => any;
  openFromText: (anchorState: any, selectionIndex: any) => any;
  projectElementAnchor: (element: any, x: number, y: number) => any;
  openFromElement: (element: any, anchorState: any, selectionIndex: any, extra: any) => any;
};

/** Routes site annotation requests to text or element anchor lifecycles after the editor gate. */
function createAnnotationSiteRequestDispatchController(dependencies: AnnotationSiteRequestDispatchDependencies) {
  let disposed = false;
  const dispatch = (
    source: any,
    point: { x: number; y: number },
    selectionIndex: any,
    extra: any,
    context: { editorOpen: boolean },
  ) => {
    if (disposed || context.editorOpen) return false;
    if (source instanceof Range) {
      const anchorState = dependencies.resolveTextAnchor(source);
      return anchorState != null ? dependencies.openFromText(anchorState, selectionIndex) : false;
    }
    return dependencies.openFromElement(source, dependencies.projectElementAnchor(source, point.x, point.y), selectionIndex, extra);
  };
  const dispose = () => { disposed = true; };
  return { dispatch, dispose };
}

export { createAnnotationSiteRequestDispatchController };
if (typeof module !== `undefined`) module.exports = { createAnnotationSiteRequestDispatchController };
