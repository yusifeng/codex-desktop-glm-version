import { shouldDeferAnnotationMount, shouldSyncAnnotationPolicy } from "./annotation-preload-startup-policy";

type AnnotationPreloadLifecycleDependencies = {
  ipcRenderer: any;
  windowLike: any;
  documentLike: any;
  globalLike: any;
  channels: { hostMessage: string; policy: string };
  initializeFeatures: (policy: any) => void;
  handleHostMessage: (...args: any[]) => void;
  mount: () => void;
  onPageHide: (event: any) => void;
};

/** Installs the annotation preload listeners and starts its page-bound runtime. */
function initializeAnnotationPreload(deps: AnnotationPreloadLifecycleDependencies) {
  deps.ipcRenderer.on(deps.channels.hostMessage, deps.handleHostMessage);
  if (shouldSyncAnnotationPolicy(deps.globalLike, deps.windowLike)) {
    deps.initializeFeatures(deps.ipcRenderer.sendSync(deps.channels.policy));
  }
  if (shouldDeferAnnotationMount(deps.documentLike)) {
    deps.windowLike.addEventListener(`DOMContentLoaded`, deps.mount, { once: true });
  } else {
    deps.mount();
  }
  deps.windowLike.addEventListener(`pagehide`, deps.onPageHide);
}

export { initializeAnnotationPreload };
if (typeof module !== `undefined`) module.exports = { initializeAnnotationPreload };
