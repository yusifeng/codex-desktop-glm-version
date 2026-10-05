import { createAnnotationPreloadMessageQueue } from "./annotation-preload-message-queue";
import { createAnnotationPreloadBridgeState } from "./annotation-preload-bridge-state";
type AnnotationPreloadBridgeOptions = {
  ipcRenderer: any;
  channels: { hostMessage: string; runtime: string };
  getState: () => any;
  getControlsRegistry: () => any;
  getSiteAnnotationRequests: () => any;
  getMountedMessageAction: (type: string) => string;
  reducePendingEditorMessage: (pending: any, message: any) => any;
  setActiveEditor: (active: boolean) => void;
};

function createAnnotationPreloadBridge(options: AnnotationPreloadBridgeOptions) {
  const lifecycle = createAnnotationPreloadBridgeState();
  const messageQueue = createAnnotationPreloadMessageQueue({ reducePendingEditorMessage: options.reducePendingEditorMessage });

  const bufferSync = (message: any) => {
    messageQueue.bufferSync(message);
  };
  const bufferTextSelection = () => {
    messageQueue.bufferTextSelection();
  };
  const bufferEditorMessage = (message: any) => {
    if (lifecycle.destroyed) return;
    options.getSiteAnnotationRequests()?.clear();
    messageQueue.bufferEditorMessage(message);
  };
  const prepareMount = () => { messageQueue.prepareMount(); };

  const bridge = {
    get initialState() {
      return options.getState();
    },
    get subscribeToSiteAnnotationRequests() {
      return options.getSiteAnnotationRequests()?.subscribe;
    },
    getAnnotationControlTargets: () => options.getControlsRegistry()?.getTargets() ?? [],
    getAnnotationControls(target: any) {
      return options.getState().canUseSiteAnnotationApi
        ? options.getControlsRegistry()?.getControls(target)
        : undefined;
    },
    sendMessageToHost(message: any) {
      if (lifecycle.destroyed) return;
      if (
        message.type === `browser-sidebar-runtime-open-editor` ||
        message.type === `browser-sidebar-runtime-open-design-editor`
      ) {
        options.setActiveEditor(true);
      } else if (
        message.type === `browser-sidebar-runtime-cancel-editor` ||
        message.type === `browser-sidebar-runtime-exit-comment-mode`
      ) {
        options.setActiveEditor(false);
        options.getSiteAnnotationRequests()?.clear();
      }
      options.ipcRenderer.invoke(options.channels.runtime, message);
    },
    subscribeToHostMessages(listener: (message: any) => void) {
      if (lifecycle.destroyed) return () => {};
      lifecycle.mountedUnsubscribe?.();
      lifecycle.markMounted();
      messageQueue.markMounted();
      const mountedHandler = (_event: any, message: any) => {
        const action = options.getMountedMessageAction(message.type);
        if (action === `sync`) listener({ ...message, canUseSiteAnnotationApi: options.getState().canUseSiteAnnotationApi });
        else if (action === `forward`) listener(message);
      };
      options.ipcRenderer.on(options.channels.hostMessage, mountedHandler);
      messageQueue.consume(listener);
      const unsubscribe = () => {
        if (!lifecycle.hasMountedSubscriber) return;
        const currentUnsubscribe = lifecycle.mountedUnsubscribe;
        lifecycle.clearMountedSubscriber();
        messageQueue.markUnmounted();
        options.ipcRenderer.removeListener(options.channels.hostMessage, mountedHandler);
        if (currentUnsubscribe === unsubscribe) lifecycle.setMountedUnsubscribe(null);
      };
      lifecycle.setMountedUnsubscribe(unsubscribe);
      return unsubscribe;
    },
  };

  const dispose = () => {
    const unsubscribe = lifecycle.mountedUnsubscribe;
    unsubscribe?.();
    if (!lifecycle.dispose()) return;
    messageQueue.dispose();
  };

  return {
    bridge,
    bufferSync,
    bufferTextSelection,
    bufferEditorMessage,
    prepareMount,
    dispose,
    get hasMountedSubscriber() { return lifecycle.hasMountedSubscriber; },
    get hasPendingEditorMessage() { return messageQueue.hasPendingEditorMessage; },
  };
}

export { createAnnotationPreloadBridge };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadBridge };
