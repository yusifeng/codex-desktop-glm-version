import { createAnnotationPreloadBridge } from "./annotation-preload-bridge";
import { createAnnotationRuntimeMount } from "./annotation-runtime-mount";
import { dispatchAnnotationHostMessage } from "./annotation-host-message-dispatcher";
import { createAnnotationFeatureLifecycle } from "./annotation-feature-lifecycle";
import { applyAnnotationSyncState } from "./annotation-sync-state";
import { createAnnotationModeToggleCommand, shouldClearAnnotationRequestsForToggle } from "./annotation-mode-command-policy";

type AnnotationPreloadRuntimeDependencies = {
  ipcRenderer: any;
  windowLike: any;
  documentLike: any;
  navigatorLike: any;
  globalLike: any;
  channels: { hostMessage: string; policy: string; pageEvent: string; runtime: string };
  featureEvent: any;
  intlConfig: any;
  createRequestId: () => string;
  createPermissionController: (deps: any) => any;
  createInitialState: (intlConfig: any) => any;
  resolveSyncState: (message: any, available: boolean) => any;
  isCommentModeActive: (state: any) => boolean;
  getMountedMessageAction: (type: string) => string;
  getPreMountMessageAction: (type: string) => string;
  reducePendingEditorMessage: (pending: any, message: any) => any;
  createControlsRegistry: () => any;
  createSiteAnnotationRequests: (options: any) => any;
  createFeatureObserver: (onFeatures: (features: any) => void) => any;
    createModeController: (...args: any[]) => any;
  loadCommentRuntime: () => Promise<{ mountBrowserCommentRuntime: (bridge: any) => any }>;
  createCustomEvent: (type: string, init: any) => any;
};

function createAnnotationPreloadRuntime(deps: AnnotationPreloadRuntimeDependencies) {
  let state = deps.createInitialState(deps.intlConfig);
  let siteAnnotationApiAvailable = false;
  let destroyed = false;
  let hasActiveEditor = false;
  let permissionGranted = false;
  let featureLifecycle: any;

  const preloadBridge = createAnnotationPreloadBridge({
    ipcRenderer: deps.ipcRenderer,
    channels: deps.channels,
    getState: () => state,
    getControlsRegistry: () => featureLifecycle?.controlsRegistry,
    getSiteAnnotationRequests: () => featureLifecycle?.siteAnnotationRequests,
    getMountedMessageAction: deps.getMountedMessageAction,
    reducePendingEditorMessage: deps.reducePendingEditorMessage,
    setActiveEditor: (active: boolean) => { hasActiveEditor = active; },
  });

  const permissionController = deps.createPermissionController({
    isPermissionGranted: () => permissionGranted,
    createRequestId: deps.createRequestId,
    invokeHost: (message: any) => deps.ipcRenderer.invoke(deps.channels.runtime, message),
  });

  const runtimeMount = createAnnotationRuntimeMount({
    loadCommentRuntime: deps.loadCommentRuntime,
    prepareMount: preloadBridge.prepareMount,
    bridge: preloadBridge.bridge,
  });

  featureLifecycle = createAnnotationFeatureLifecycle({
    permissionController,
    getState: () => ({ ...state, hasActiveEditor: hasActiveEditor || preloadBridge.hasPendingEditorMessage }),
    setPermissionGranted: (granted) => { permissionGranted = granted; },
    setFeatureApiAvailable: (available) => { siteAnnotationApiAvailable = available; },
    createControlsRegistry: deps.createControlsRegistry,
    createSiteAnnotationRequests: deps.createSiteAnnotationRequests,
    createFeatureObserver: deps.createFeatureObserver,
    createModeController: deps.createModeController,
    sendPageEvent: (features) => deps.ipcRenderer.send(deps.channels.pageEvent, { ...deps.featureEvent, payload: { features } }),
    toggleAnnotationMode: (force) => {
      const command = createAnnotationModeToggleCommand({
        destroyed,
        canUseSiteAnnotationApi: state.canUseSiteAnnotationApi === true,
        isAgentControllingBrowser: state.isAgentControllingBrowser === true,
        userActivationActive: deps.navigatorLike.userActivation?.isActive === true,
        force,
      });
      if (command == null) return false;
      if (shouldClearAnnotationRequestsForToggle(force)) featureLifecycle.siteAnnotationRequests?.clear();
      deps.ipcRenderer.invoke(deps.channels.runtime, command);
      return true;
    },
    isCommentModeActive: () => deps.isCommentModeActive(state),
  });

  const disposeFeatures = () => {
    featureLifecycle.dispose();
    runtimeMount.setPreview(null);
    siteAnnotationApiAvailable = false;
  };

  const applySync = (message: any) => {
    const result = applyAnnotationSyncState({
      state,
      message,
      siteAnnotationApiAvailable,
      modeControllerMounted: featureLifecycle.modeControllerDispose != null,
      resolveSyncState: deps.resolveSyncState,
      isCommentModeActive: deps.isCommentModeActive,
      disposeFeatures,
      clearSiteAnnotationRequests: () => featureLifecycle.siteAnnotationRequests?.clear(),
      clearPreview: () => runtimeMount.setPreview(null),
    });
    state = result.state;
    if (result.modeChanged) {
      deps.documentLike.dispatchEvent(
        deps.createCustomEvent(`oaiannotationmodechange`, { detail: { active: result.active } }),
      );
    }
  };

  const handleHostMessage = (_event: any, message: any) => {
    dispatchAnnotationHostMessage({
      action: deps.getPreMountMessageAction(message.type),
      message,
      state,
      permissionController,
      runtimeMount,
      preloadBridge,
      siteAnnotationRequests: featureLifecycle.siteAnnotationRequests,
      setActiveEditor: (active) => { hasActiveEditor = active; },
      applySync,
    });
  };

  const initializeFeatures = (policy: any) => {
    featureLifecycle.initialize(policy);
    state = {
      ...state,
      canUseSiteAnnotationApi: policy.enabled && policy.siteAnnotationFeaturesEnabled,
      canUseTweaks: policy.canUseTweaks,
      isAgentControllingBrowser: policy.isAgentControllingBrowser,
      interactionMode: policy.isAnnotationModeActive ? `comment` : `browse`,
    };
  };

  const onPageHide = (event: any) => {
    runtimeMount.setPreview(null);
    if (event.isTrusted) permissionController.reset();
    if (!event.isTrusted || event.persisted) return;
    destroyed = true;
    disposeFeatures();
    deps.windowLike.removeEventListener(`DOMContentLoaded`, runtimeMount.mount);
    deps.ipcRenderer.removeListener(deps.channels.hostMessage, handleHostMessage);
    runtimeMount.dispose();
  };

  const initialize = () => {
    deps.ipcRenderer.on(deps.channels.hostMessage, handleHostMessage);
    if (deps.globalLike.isSecureContext === true && deps.windowLike === deps.windowLike.top) {
      initializeFeatures(deps.ipcRenderer.sendSync(deps.channels.policy));
    }
    if (deps.documentLike.readyState === `loading`) {
      deps.windowLike.addEventListener(`DOMContentLoaded`, runtimeMount.mount, { once: true });
    } else {
      runtimeMount.mount();
    }
    deps.windowLike.addEventListener(`pagehide`, onPageHide);
  };

  return { initialize };
}

export { createAnnotationPreloadRuntime };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadRuntime };
