type AnnotationPointSelectionDependencies = {
  focusEditor: () => void;
  getCapturedPoint: () => any;
  clearCapturedPoint: () => void;
  now: () => number;
  captureMaxAge: number;
  selectCapturedPoint: (point: any) => boolean;
  openCapturedFallback: (element: any, anchorState: any) => boolean;
  selectPoint: (point: { x: number; y: number }) => boolean;
  resolveElement: (point: { x: number; y: number }, canUseSiteAnnotationApi: boolean) => any;
  projectAnchor: (element: any, point: { x: number; y: number }) => any;
  openAt: (element: any, anchorState: any) => boolean;
};

/** Coordinates point-to-editor selection priority without owning editor IPC/state. */
function createAnnotationPointSelectionController(dependencies: AnnotationPointSelectionDependencies) {
  let disposed = false;

  const select = (
    point: { x: number; y: number },
    context: { isEditorOpen: boolean; canUseSiteAnnotationApi: boolean },
  ) => {
    if (disposed) return false;
    if (context.isEditorOpen) {
      dependencies.focusEditor();
      return true;
    }
    const captured = dependencies.getCapturedPoint();
    dependencies.clearCapturedPoint();
    if (
      captured != null &&
      dependencies.now() - captured.capturedAt <= dependencies.captureMaxAge
    ) {
      return (
        dependencies.selectCapturedPoint(captured.viewportPoint) ||
        dependencies.openCapturedFallback(captured.element, captured.anchorState)
      );
    }
    if (dependencies.selectPoint(point)) return true;
    const element = dependencies.resolveElement(point, context.canUseSiteAnnotationApi);
    if (element == null) return false;
    return dependencies.openAt(element, dependencies.projectAnchor(element, point));
  };

  const dispose = () => {
    disposed = true;
  };

  return { select, dispose };
}

export { createAnnotationPointSelectionController };
if (typeof module !== `undefined`) module.exports = { createAnnotationPointSelectionController };
