type AnnotationFeatureLifecycleDependencies = {
  permissionController: { reset: () => void; requestPermission: () => boolean | Promise<boolean> };
  getState: () => any;
  setPermissionGranted: (granted: boolean) => void;
  setFeatureApiAvailable: (available: boolean) => void;
  createControlsRegistry: () => any;
  createSiteAnnotationRequests: (options: any) => any;
  createFeatureObserver: (onFeatures: (features: any) => void) => any;
  createModeController: (...args: any[]) => any;
  sendPageEvent: (features: any) => void;
  toggleAnnotationMode: (force: any) => boolean;
  isCommentModeActive: () => boolean;
};

/** Owns the disposable feature objects created from the annotation policy. */
function createAnnotationFeatureLifecycle(deps: AnnotationFeatureLifecycleDependencies) {
  let controlsRegistry: any = null;
  let siteAnnotationRequests: any = null;
  let featureObserver: any = null;
  let modeControllerDispose: (() => void) | null = null;

  const dispose = () => {
    deps.permissionController.reset();
    deps.setPermissionGranted(false);
    featureObserver?.dispose();
    featureObserver = null;
    siteAnnotationRequests?.dispose();
    siteAnnotationRequests = null;
    modeControllerDispose?.();
    modeControllerDispose = null;
    controlsRegistry?.dispose();
    controlsRegistry = null;
    deps.setFeatureApiAvailable(false);
  };

  const initialize = (policy: any) => {
    deps.setFeatureApiAvailable(policy.enabled);
    deps.setPermissionGranted(policy.siteAnnotationPermissionGranted);
    if (!policy.enabled) return;
    controlsRegistry = deps.createControlsRegistry();
    siteAnnotationRequests = deps.createSiteAnnotationRequests({
      requestPermission: deps.permissionController.requestPermission,
      getState: () => {
        const state = deps.getState();
        return {
          canUseSiteAnnotationApi: state.canUseSiteAnnotationApi === true,
          canUseTweaks: state.canUseTweaks === true,
          isAgentControllingBrowser: state.isAgentControllingBrowser,
          hasActiveEditor: state.hasActiveEditor,
        };
      },
    });
    featureObserver = deps.createFeatureObserver(deps.sendPageEvent);
    modeControllerDispose = deps.createModeController(
      deps.toggleAnnotationMode,
      deps.isCommentModeActive,
      featureObserver.recordUse,
      () => deps.getState().canUseSiteAnnotationApi === true,
    );
    if (modeControllerDispose == null) {
      controlsRegistry.dispose();
      controlsRegistry = null;
      siteAnnotationRequests.dispose();
      siteAnnotationRequests = null;
    }
  };

  return {
    initialize,
    dispose,
    get controlsRegistry() { return controlsRegistry; },
    get siteAnnotationRequests() { return siteAnnotationRequests; },
    get featureObserver() { return featureObserver; },
    get modeControllerDispose() { return modeControllerDispose; },
  };
}

export { createAnnotationFeatureLifecycle };
if (typeof module !== `undefined`) module.exports = { createAnnotationFeatureLifecycle };
