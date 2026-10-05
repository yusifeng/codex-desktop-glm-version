import { createAnnotationPreloadBridge } from "./annotation-preload-bridge";
import { createAnnotationRuntimeMount } from "./annotation-runtime-mount";
import { dispatchAnnotationHostMessage } from "./annotation-host-message-dispatcher";
import { createAnnotationFeatureLifecycle } from "./annotation-feature-lifecycle";
import { applyAnnotationSyncState } from "./annotation-sync-state";
import { createAnnotationModeToggleCommand, shouldClearAnnotationRequestsForToggle } from "./annotation-mode-command-policy";
import { handleAnnotationPagehide } from "./annotation-pagehide";
import { initializeAnnotationPreload } from "./annotation-preload-lifecycle";
import { applyAnnotationPreloadPolicyState } from "./annotation-preload-policy-state";

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
    state = applyAnnotationPreloadPolicyState(state, policy);
  };

  const onPageHide = (event: any) => {
    handleAnnotationPagehide(event, {
      clearPreview: () => runtimeMount.setPreview(null),
      resetPermission: () => permissionController.reset(),
      disposeFeatures,
      markDestroyed: () => { destroyed = true; },
      removeDOMContentLoaded: () => deps.windowLike.removeEventListener(`DOMContentLoaded`, runtimeMount.mount),
      removeHostMessageListener: () => deps.ipcRenderer.removeListener(deps.channels.hostMessage, handleHostMessage),
      disposeRuntimeMount: () => runtimeMount.dispose(),
    });
  };

  const initialize = () => {
    initializeAnnotationPreload({
      ipcRenderer: deps.ipcRenderer,
      windowLike: deps.windowLike,
      documentLike: deps.documentLike,
      globalLike: deps.globalLike,
      channels: deps.channels,
      initializeFeatures,
      handleHostMessage,
      mount: runtimeMount.mount,
      onPageHide,
    });
  };

  return { initialize };
}

export { createAnnotationPreloadRuntime };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadRuntime };
