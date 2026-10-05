type AnnotationPreviewControllerDependencies<TPreview> = {
  mountPreview: (preview: TPreview) => (() => void) | { dispose?: () => void } | null | undefined;
};

/** Owns replacement and teardown of the currently mounted annotation preview. */
function createAnnotationPreviewController<TPreview>(deps: AnnotationPreviewControllerDependencies<TPreview>) {
  let disposeCurrent: (() => void) | null = null;
  let disposed = false;

  const clearCurrent = () => {
    disposeCurrent?.();
    disposeCurrent = null;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearCurrent();
  };

  return {
    setPreview(preview: TPreview | null | undefined) {
      if (disposed) return;
      clearCurrent();
      if (preview == null) return;
      const mounted = deps.mountPreview(preview);
      if (typeof mounted === `function`) disposeCurrent = mounted;
      else if (mounted?.dispose != null) disposeCurrent = mounted.dispose;
    },
    dispose,
  };
}

export { createAnnotationPreviewController };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreviewController };
