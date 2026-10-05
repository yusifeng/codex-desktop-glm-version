type AnnotationRuntimeMountDependencies = {
  loadCommentRuntime: () => Promise<{ mountBrowserCommentRuntime: (bridge: any) => any }>;
  prepareMount: () => void;
  bridge: any;
};

/** Owns the async comment-runtime mount race and pending site-preview handoff. */
function createAnnotationRuntimeMount(deps: AnnotationRuntimeMountDependencies) {
  let mountedRuntime: any = null;
  let pendingPreview: any = null;
  let mountStarted = false;
  let destroyed = false;
  const setPreview = (preview: any) => {
    if (mountedRuntime == null) pendingPreview = preview;
    else mountedRuntime.setSiteAnnotationPreview(preview);
  };
  const mount = () => {
    if (mountStarted || destroyed) return;
    mountStarted = true;
    deps.loadCommentRuntime().then(({ mountBrowserCommentRuntime }) => {
      if (destroyed) return;
      deps.prepareMount();
      mountedRuntime = mountBrowserCommentRuntime(deps.bridge);
      mountedRuntime.setSiteAnnotationPreview(pendingPreview);
      pendingPreview = null;
    }).catch(() => {
      // A failed dynamic import must not permanently consume the one-shot
      // guard.  Keep the mount retryable while the page is still alive;
      // pagehide/dispose continues to make the lifecycle terminal.
      if (!destroyed && mountedRuntime == null) mountStarted = false;
    });
  };
  const dispose = () => {
    destroyed = true;
    pendingPreview = null;
    mountedRuntime?.dispose();
    mountedRuntime = null;
  };
  return { mount, setPreview, dispose };
}

export { createAnnotationRuntimeMount };
if (typeof module !== `undefined`) module.exports = { createAnnotationRuntimeMount };
