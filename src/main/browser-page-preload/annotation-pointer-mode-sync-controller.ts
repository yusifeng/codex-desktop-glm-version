type AnnotationPointerModeSyncDependencies = {
  setEnabled: (enabled: boolean) => void;
  invalidate: () => void;
};

/** Applies host pointer-mode state and invalidates geometry when zoom changes. */
function createAnnotationPointerModeSyncController(
  dependencies: AnnotationPointerModeSyncDependencies,
) {
  let disposed = false;

  const sync = (message: any, currentZoomPercent: number, isAgentControllingBrowser: boolean) => {
    if (disposed) return false;
    dependencies.setEnabled(
      message.canUseSiteAnnotationApi === true &&
        message.interactionMode === `comment` &&
        message.isAnnotationSuspended !== true &&
        !isAgentControllingBrowser,
    );
    if (currentZoomPercent !== message.zoomPercent) {
      dependencies.invalidate();
    }
    return true;
  };

  const dispose = () => {
    disposed = true;
  };

  return { sync, dispose };
}

export { createAnnotationPointerModeSyncController };
if (typeof module !== `undefined`) module.exports = { createAnnotationPointerModeSyncController };
