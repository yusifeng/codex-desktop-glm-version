type AnnotationRuntimeMountDependencies = {
  loadCommentRuntime: () => Promise<{ mountBrowserCommentRuntime: (bridge: any) => any }>;
  prepareMount: () => void;
  bridge: any;
};

/** Owns the async comment-runtime mount race and pending site-preview handoff. */
function createAnnotationRuntimeMount(deps: AnnotationRuntimeMountDependencies) {
  const state = createAnnotationRuntimeMountState();
  const setPreview = (preview: any) => {
    if (state.mountedRuntime == null) state.setPendingPreview(preview);
    else state.mountedRuntime.setSiteAnnotationPreview(preview);
  };
  const mount = () => {
    if (!state.beginMount()) return;
    deps.loadCommentRuntime().then(({ mountBrowserCommentRuntime }) => {
      if (state.destroyed) return;
      deps.prepareMount();
      const mountedRuntime = mountBrowserCommentRuntime(deps.bridge);
      const pendingPreview = state.pendingPreview;
      if (!state.completeMount(mountedRuntime)) {
        mountedRuntime?.dispose?.();
        return;
      }
      mountedRuntime.setSiteAnnotationPreview(pendingPreview);
    }).catch(() => {
      // A failed dynamic import must not permanently consume the one-shot
      // guard.  Keep the mount retryable while the page is still alive;
      // pagehide/dispose continues to make the lifecycle terminal.
      state.retryAfterFailure();
    });
  };
  const dispose = () => {
    state.dispose()?.dispose?.();
  };
  return { mount, setPreview, dispose, get destroyed() { return state.destroyed; } };
}

export { createAnnotationRuntimeMount };
if (typeof module !== `undefined`) module.exports = { createAnnotationRuntimeMount };
import { createAnnotationRuntimeMountState } from "./annotation-runtime-mount-state";
