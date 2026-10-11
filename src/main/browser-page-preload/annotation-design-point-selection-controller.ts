type AnnotationDesignPointSelectionDependencies = {
  focusEditor: () => void;
  getCapturedPoint: () => any;
  clearCapturedPoint: () => void;
  now: () => number;
  captureMaxAge: number;
  resolveElement: (point: { x: number; y: number }, canUseSiteAnnotationApi: boolean, mode: string) => any;
  projectAnchor: (element: any, point: { x: number; y: number }) => any;
  openDesignEditor: (element: any, anchorState: any) => boolean;
};

/** Coordinates design-editor point selection and captured design-element restoration. */
function createAnnotationDesignPointSelectionController(
  dependencies: AnnotationDesignPointSelectionDependencies,
) {
  let disposed = false;

  const open = (
    point: { x: number; y: number },
    mode: string,
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
      dependencies.now() - captured.capturedAt <= dependencies.captureMaxAge &&
      captured.designElement != null
    ) {
      const element = captured.designElement;
      const anchorState = element === captured.element
        ? captured.anchorState
        : dependencies.projectAnchor(element, point);
      return dependencies.openDesignEditor(element, anchorState);
    }
    const element = dependencies.resolveElement(
      point,
      context.canUseSiteAnnotationApi,
      mode,
    );
    if (element == null) return false;
    return dependencies.openDesignEditor(element, dependencies.projectAnchor(element, point));
  };

  const dispose = () => {
    disposed = true;
  };

  return { open, dispose };
}

export { createAnnotationDesignPointSelectionController };
if (typeof module !== `undefined`) module.exports = { createAnnotationDesignPointSelectionController };
