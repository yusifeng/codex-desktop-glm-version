type AnnotationHoverFallbackDependencies = {
  resolveElement: (x: number, y: number, canUseSiteAnnotationApi: boolean, rootHost: any) => any;
  projectAnchor: (element: any, x: number, y: number) => any;
  openAt: (element: any, anchorState: any) => void;
  resolveHover: (element: any) => any;
  setHover: (hover: any) => void;
};

/** Handles pointer hover fallback and click-to-open routing after the DOM hit-test guard. */
function createAnnotationHoverFallbackController(dependencies: AnnotationHoverFallbackDependencies) {
  let disposed = false;
  const handle = (
    point: { x: number; y: number },
    openEditor: boolean,
    context: { editorOpen: boolean; interactionMode: string; canUseSiteAnnotationApi: boolean; rootHost: any },
  ) => {
    if (disposed || context.editorOpen || context.interactionMode !== `comment`) return false;
    const element = dependencies.resolveElement(point.x, point.y, context.canUseSiteAnnotationApi, context.rootHost);
    if (element == null) return false;
    if (openEditor) dependencies.openAt(element, dependencies.projectAnchor(element, point.x, point.y));
    else dependencies.setHover(dependencies.resolveHover(element));
    return true;
  };
  const dispose = () => { disposed = true; };
  return { handle, dispose };
}

export { createAnnotationHoverFallbackController };
if (typeof module !== `undefined`) module.exports = { createAnnotationHoverFallbackController };
