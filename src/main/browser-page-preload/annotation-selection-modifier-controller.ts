type AnnotationSelectionModifierDependencies = {
  setModifierActive: (active: boolean) => void;
  clearPointer: () => void;
  clearHover: () => void;
  clearTransient: () => void;
  isSelectionSuppressed: () => boolean;
  getPointer: () => { x: number; y: number } | null;
  preparePointer: (pointer: { x: number; y: number }, rootHost: unknown) => void;
  resolveElement: (pointer: { x: number; y: number }, rootHost: unknown, canUseSiteAnnotationApi: boolean) => any;
  focusDocument: (document: unknown) => void;
  projectAnchor: (element: any, pointer: { x: number; y: number }) => unknown;
  setSelectionHover: (value: unknown) => void;
  setHoverState: (value: unknown) => void;
  resolveHover: (element: any) => unknown;
  setPointer: (pointer: { x: number; y: number }) => void;
};

/** Coordinates selection-modifier DOM hit testing and transient hover state. */
function createAnnotationSelectionModifierController(
  dependencies: AnnotationSelectionModifierDependencies,
) {
  let disposed = false;

  const sync = (
    requested: boolean,
    context: {
      rootHost: unknown;
      isCreateElementTarget: boolean;
      canUseSiteAnnotationApi: boolean;
    },
  ) => {
    if (disposed) return false;
    dependencies.setModifierActive(requested);
    if (!requested) {
      dependencies.clearPointer();
      dependencies.clearHover();
      dependencies.clearTransient();
      return true;
    }
    if (!context.isCreateElementTarget) return true;
    const pointer = dependencies.getPointer();
    if (pointer == null || dependencies.isSelectionSuppressed()) return true;
    dependencies.preparePointer(pointer, context.rootHost);
    const element = dependencies.resolveElement(
      pointer,
      context.rootHost,
      context.canUseSiteAnnotationApi,
    );
    if (element == null) {
      dependencies.clearPointer();
      dependencies.clearHover();
      dependencies.clearTransient();
      return true;
    }
    dependencies.focusDocument(element.ownerDocument);
    dependencies.setPointer(pointer);
    dependencies.setSelectionHover(dependencies.projectAnchor(element, pointer));
    dependencies.setHoverState(dependencies.resolveHover(element));
    return true;
  };

  const dispose = () => {
    disposed = true;
  };

  return { sync, dispose };
}

export { createAnnotationSelectionModifierController };
if (typeof module !== `undefined`) module.exports = { createAnnotationSelectionModifierController };
