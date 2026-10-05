import { shouldResetAnnotationFeatureGraph } from "./annotation-feature-lifecycle-state";
import { createAnnotationFeatureGraphState } from "./annotation-feature-graph-state";

type AnnotationFeatureLifecycleDependencies = {
  permissionController: { reset: () => void; requestPermission: () => boolean | Promise<boolean>; dispose?: () => void };
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
  const graph = createAnnotationFeatureGraphState();

  const dispose = () => {
    deps.permissionController.reset();
    deps.setPermissionGranted(false);
    graph.featureObserver?.dispose();
    graph.siteAnnotationRequests?.dispose();
    graph.modeControllerDispose?.();
    graph.controlsRegistry?.dispose();
    graph.clear();
    deps.setFeatureApiAvailable(false);
  };

  const initialize = (policy: any) => {
    // Host policy can be refreshed while the preload remains mounted. Tear
    // down the previous feature graph first so listeners/registries from the
    // old capability set cannot leak into the new generation.
    if (shouldResetAnnotationFeatureGraph(graph)) {
      dispose();
    }
    deps.setFeatureApiAvailable(policy.enabled);
    deps.setPermissionGranted(policy.siteAnnotationPermissionGranted);
    if (!policy.enabled) return;
    graph.setControlsRegistry(deps.createControlsRegistry());
    graph.setSiteAnnotationRequests(deps.createSiteAnnotationRequests({
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
    }));
    graph.setFeatureObserver(deps.createFeatureObserver(deps.sendPageEvent));
    graph.setModeControllerDispose(deps.createModeController(
      deps.toggleAnnotationMode,
      deps.isCommentModeActive,
      graph.featureObserver.recordUse,
      () => deps.getState().canUseSiteAnnotationApi === true,
    ));
    if (graph.modeControllerDispose == null) {
      graph.controlsRegistry.dispose();
      graph.setControlsRegistry(null);
      graph.siteAnnotationRequests.dispose();
      graph.setSiteAnnotationRequests(null);
    }
  };

  return {
    initialize,
    dispose,
    get controlsRegistry() { return graph.controlsRegistry; },
    get siteAnnotationRequests() { return graph.siteAnnotationRequests; },
    get featureObserver() { return graph.featureObserver; },
    get modeControllerDispose() { return graph.modeControllerDispose; },
  };
}

export { createAnnotationFeatureLifecycle };
if (typeof module !== `undefined`) module.exports = { createAnnotationFeatureLifecycle };
