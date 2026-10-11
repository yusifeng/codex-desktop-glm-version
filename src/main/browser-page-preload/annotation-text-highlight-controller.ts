type AnnotationTextHighlightControllerDependencies = {
  apply: (anchor: any) => (() => void) | void;
};

/** Replaces CSS text highlights and tears down the previous style/range atomically. */
function createAnnotationTextHighlightController(dependencies: AnnotationTextHighlightControllerDependencies) {
  let cleanup: (() => void) | null = null;
  let disposed = false;
  const update = (anchor: any) => {
    cleanup?.();
    cleanup = null;
    if (disposed || anchor == null) return;
    const nextCleanup = dependencies.apply(anchor);
    cleanup = typeof nextCleanup === `function` ? nextCleanup : null;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cleanup?.();
    cleanup = null;
  };
  return { update, dispose };
}

export { createAnnotationTextHighlightController };
if (typeof module !== `undefined`) module.exports = { createAnnotationTextHighlightController };
