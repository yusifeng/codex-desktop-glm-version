type AnnotationPointRetryDependencies = {
  requestAnimationFrame: (callback: () => void) => unknown;
  cancelAnimationFrame: (handle: unknown) => void;
};

/** Retries point actions across animation frames while preventing stale callbacks after dispose. */
function createAnnotationPointRetryController(dependencies: AnnotationPointRetryDependencies) {
  let disposed = false;
  const pending = new Set<unknown>();

  const retry = <T>(value: T, action: (value: T) => boolean) => {
    if (disposed) return false;
    let retries = 2;
    const run = () => {
      if (disposed) return;
      const handle = currentHandle;
      if (handle !== undefined) pending.delete(handle);
      if (action(value) || retries === 0) return;
      retries -= 1;
      currentHandle = dependencies.requestAnimationFrame(run);
      pending.add(currentHandle);
    };
    let currentHandle: unknown = dependencies.requestAnimationFrame(run);
    pending.add(currentHandle);
    return true;
  };

  const dispose = () => {
    disposed = true;
    for (const handle of pending) dependencies.cancelAnimationFrame(handle);
    pending.clear();
  };

  return { retry, dispose };
}

export { createAnnotationPointRetryController };
if (typeof module !== `undefined`) module.exports = { createAnnotationPointRetryController };
