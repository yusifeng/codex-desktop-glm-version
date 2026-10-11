type AnnotationScreenshotReadyControllerDependencies = {
  requestAnimationFrame: (callback: () => void) => any;
  cancelAnimationFrame: (handle: any) => void;
};

/** Coalesces screenshot-ready notifications and cancels stale effect frames. */
function createAnnotationScreenshotReadyController(dependencies: AnnotationScreenshotReadyControllerDependencies) {
  let lastActiveId: string | null = null;
  let frame: any = null;
  let disposed = false;
  const update = (activeId: string | null, hasActiveView: boolean, notifyReady: (commentId: string) => void) => {
    if (disposed) return () => {};
    if (!hasActiveView || activeId == null) {
      lastActiveId = null;
      return () => {};
    }
    if (lastActiveId === activeId) return () => {};
    lastActiveId = activeId;
    frame = dependencies.requestAnimationFrame(() => {
      frame = null;
      if (!disposed) notifyReady(activeId);
    });
    return () => {
      if (frame != null) {
        dependencies.cancelAnimationFrame(frame);
        frame = null;
      }
    };
  };
  const dispose = () => {
    disposed = true;
    if (frame != null) {
      dependencies.cancelAnimationFrame(frame);
      frame = null;
    }
  };
  return { update, dispose };
}

export { createAnnotationScreenshotReadyController };
if (typeof module !== `undefined`) module.exports = { createAnnotationScreenshotReadyController };
