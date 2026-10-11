type AnnotationUnavailableSiteInteractionDependencies = {
  cancelInteraction: () => boolean;
  markViewportSelection: () => void;
  disablePointerMode: () => void;
};

/** Cancels site interaction and preserves the conditional viewport-selection marker ordering. */
function createAnnotationUnavailableSiteInteractionController(
  dependencies: AnnotationUnavailableSiteInteractionDependencies,
) {
  let disposed = false;

  const cancel = () => {
    if (disposed) return false;
    if (dependencies.cancelInteraction()) dependencies.markViewportSelection();
    dependencies.disablePointerMode();
    return true;
  };
  const dispose = () => {
    disposed = true;
  };

  return { cancel, dispose };
}

export { createAnnotationUnavailableSiteInteractionController };
if (typeof module !== `undefined`) module.exports = { createAnnotationUnavailableSiteInteractionController };
