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
