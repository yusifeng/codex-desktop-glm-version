type AnnotationViewportRefreshSchedulerDependencies = {
  requestAnimationFrame: (callback: () => void) => any;
  cancelAnimationFrame: (handle: any) => void;
  refresh: () => void;
};

/** Coalesces viewport refreshes into one cancellable animation frame. */
function createAnnotationViewportRefreshScheduler(
  dependencies: AnnotationViewportRefreshSchedulerDependencies,
) {
  let frame: any = null;
  let disposed = false;
  const schedule = () => {
    if (disposed) return;
    if (frame != null) dependencies.cancelAnimationFrame(frame);
    frame = dependencies.requestAnimationFrame(() => {
      frame = null;
      if (!disposed) dependencies.refresh();
    });
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame != null) {
      dependencies.cancelAnimationFrame(frame);
      frame = null;
    }
  };
  const cancel = () => {
    if (frame != null) {
      dependencies.cancelAnimationFrame(frame);
      frame = null;
    }
  };
  return { schedule, cancel, dispose };
}

export { createAnnotationViewportRefreshScheduler };
if (typeof module !== `undefined`) module.exports = { createAnnotationViewportRefreshScheduler };
