/** Handles annotation preload cleanup at the browser pagehide boundary. */
type AnnotationPagehideDependencies = {
  clearPreview: () => void;
  resetPermission: () => void;
  disposeFeatures: () => void;
  removeDOMContentLoaded: () => void;
  removeHostMessageListener: () => void;
  disposeRuntimeMount: () => void;
  disposePreloadBridge?: () => void;
  markDestroyed: () => void;
};

function handleAnnotationPagehide(
  event: { isTrusted?: boolean; persisted?: boolean },
  deps: AnnotationPagehideDependencies,
) {
  deps.clearPreview();
  if (event?.isTrusted) deps.resetPermission();
  if (!event?.isTrusted || event.persisted) return false;
  deps.markDestroyed();
  deps.disposeFeatures();
  deps.removeDOMContentLoaded();
  deps.removeHostMessageListener();
  deps.disposeRuntimeMount();
  deps.disposePreloadBridge?.();
  return true;
}

export { handleAnnotationPagehide };
if (typeof module !== `undefined`) module.exports = { handleAnnotationPagehide };
