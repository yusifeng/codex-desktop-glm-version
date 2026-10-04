import { createAnnotationPreloadBridge } from "./annotation-preload-bridge";
import { createAnnotationRuntimeMount } from "./annotation-runtime-mount";

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
  let siteAnnotationRequests: any = null;
  let modeControllerDispose: any = null;
  let featureObserver: any = null;
  let controlsRegistry: any = null;

  const preloadBridge = createAnnotationPreloadBridge({
    ipcRenderer: deps.ipcRenderer,
    channels: deps.channels,
    getState: () => state,
    getControlsRegistry: () => controlsRegistry,
    getSiteAnnotationRequests: () => siteAnnotationRequests,
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

  const disposeFeatures = () => {
    permissionController.reset();
    permissionGranted = false;
    runtimeMount.setPreview(null);
    siteAnnotationApiAvailable = false;
    featureObserver?.dispose();
    featureObserver = null;
    siteAnnotationRequests?.dispose();
    siteAnnotationRequests = null;
    modeControllerDispose?.();
    modeControllerDispose = null;
    controlsRegistry?.dispose();
    controlsRegistry = null;
  };

  const applySync = (message: any) => {
    const wasActive = modeControllerDispose != null && deps.isCommentModeActive(state);
    if (message.canUseSiteAnnotationApi === false) disposeFeatures();
    if (message.isAgentControllingBrowser || message.siteAnnotationFeaturesEnabled === false) {
      siteAnnotationRequests?.clear();
      runtimeMount.setPreview(null);
    }
    state = deps.resolveSyncState(message, siteAnnotationApiAvailable);
    const isActive = modeControllerDispose != null && deps.isCommentModeActive(state);
    if (isActive !== wasActive) {
      deps.documentLike.dispatchEvent(
        deps.createCustomEvent(`oaiannotationmodechange`, { detail: { active: isActive } }),
      );
    }
  };

  const handleHostMessage = (_event: any, message: any) => {
    switch (deps.getPreMountMessageAction(message.type)) {
      case `permission-result`:
        permissionController.handleResult(message.requestId, message.allowed);
        return;
      case `preview`:
        runtimeMount.setPreview(state.canUseSiteAnnotationApi && !state.isAgentControllingBrowser ? message.preview : null);
        return;
      case `sync`:
        applySync(message);
        preloadBridge.bufferSync({ ...message, canUseSiteAnnotationApi: state.canUseSiteAnnotationApi });
        return;
      case `capture-text-selection`:
        preloadBridge.bufferTextSelection();
        return;
      case `queue-editor-message`:
        siteAnnotationRequests?.clear();
        preloadBridge.bufferEditorMessage(message);
        return;
      case `close-editor`:
        hasActiveEditor = false;
        siteAnnotationRequests?.clear();
        preloadBridge.bufferEditorMessage(message);
        return;
    }
  };

  const initializeFeatures = (policy: any) => {
    siteAnnotationApiAvailable = policy.enabled;
    permissionGranted = policy.siteAnnotationPermissionGranted;
    state = {
      ...state,
      canUseSiteAnnotationApi: policy.enabled && policy.siteAnnotationFeaturesEnabled,
      canUseTweaks: policy.canUseTweaks,
      isAgentControllingBrowser: policy.isAgentControllingBrowser,
      interactionMode: policy.isAnnotationModeActive ? `comment` : `browse`,
    };
    if (!policy.enabled) return;

    controlsRegistry = deps.createControlsRegistry();
    siteAnnotationRequests = deps.createSiteAnnotationRequests({
      requestPermission: permissionController.requestPermission,
      getState: () => ({
        canUseSiteAnnotationApi: state.canUseSiteAnnotationApi === true,
        canUseTweaks: state.canUseTweaks === true,
        isAgentControllingBrowser: state.isAgentControllingBrowser,
        hasActiveEditor: hasActiveEditor || preloadBridge.hasPendingEditorMessage,
      }),
    });
    featureObserver = deps.createFeatureObserver((features) => {
      deps.ipcRenderer.send(deps.channels.pageEvent, { ...deps.featureEvent, payload: { features } });
    });
    modeControllerDispose = deps.createModeController(
      (force: any) => {
        if (
          destroyed ||
          state.canUseSiteAnnotationApi !== true ||
          state.isAgentControllingBrowser ||
          deps.navigatorLike.userActivation?.isActive !== true
        ) return false;
        if (force !== true) siteAnnotationRequests?.clear();
        deps.ipcRenderer.invoke(deps.channels.runtime, {
          type: `browser-sidebar-runtime-toggle-annotation-mode`,
          force,
        });
        return true;
      },
      () => deps.isCommentModeActive(state),
      featureObserver.recordUse,
      () => state.canUseSiteAnnotationApi === true,
    );
    if (modeControllerDispose == null) {
      controlsRegistry.dispose();
      controlsRegistry = null;
      siteAnnotationRequests.dispose();
      siteAnnotationRequests = null;
    }
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
