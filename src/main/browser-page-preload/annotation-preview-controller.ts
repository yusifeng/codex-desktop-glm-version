type AnnotationPreviewControllerDependencies<TPreview> = {
  mountPreview: (preview: TPreview) => (() => void) | { dispose?: () => void } | null | undefined;
};

/** Owns replacement and teardown of the currently mounted annotation preview. */
function createAnnotationPreviewController<TPreview>(deps: AnnotationPreviewControllerDependencies<TPreview>) {
  const state = createAnnotationPreviewControllerState();

  const clearCurrent = () => {
    state.disposeCurrent?.();
    state.setDisposeCurrent(null);
  };
  const dispose = () => {
    clearCurrent();
    state.dispose();
  };

  return {
    setPreview(preview: TPreview | null | undefined) {
      if (state.disposed) return;
      clearCurrent();
      if (preview == null) return;
      const mounted = deps.mountPreview(preview);
      if (typeof mounted === `function`) state.setDisposeCurrent(mounted);
      else if (mounted?.dispose != null) state.setDisposeCurrent(mounted.dispose);
    },
    dispose,
  };
}

export { createAnnotationPreviewController };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreviewController };
import { createAnnotationPreviewControllerState } from "./annotation-preview-controller-state";
