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
  let hasMountedSubscriber = false;
  let bufferedSync: any = null;
  let pendingTextSelection = false;
  let pendingEditorMessage: any = null;

  const bufferSync = (message: any) => {
    if (!hasMountedSubscriber) bufferedSync = message;
  };
  const bufferTextSelection = () => {
    if (!hasMountedSubscriber) pendingTextSelection = true;
  };
  const bufferEditorMessage = (message: any) => {
    options.getSiteAnnotationRequests()?.clear();
    if (!hasMountedSubscriber) {
      pendingEditorMessage = options.reducePendingEditorMessage(pendingEditorMessage, message);
    }
  };
  const prepareMount = () => { bufferedSync = null; };

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
      hasMountedSubscriber = true;
      const mountedHandler = (_event: any, message: any) => {
        const action = options.getMountedMessageAction(message.type);
        if (action === `sync`) listener({ ...message, canUseSiteAnnotationApi: options.getState().canUseSiteAnnotationApi });
        else if (action === `forward`) listener(message);
      };
      options.ipcRenderer.on(options.channels.hostMessage, mountedHandler);
      if (bufferedSync != null) {
        listener(bufferedSync);
        bufferedSync = null;
      }
      if (pendingTextSelection) {
        listener({ type: `browser-sidebar-runtime-capture-text-selection` });
        pendingTextSelection = false;
      }
      if (pendingEditorMessage != null) {
        listener(pendingEditorMessage);
        pendingEditorMessage = null;
      }
      return () => {
        hasMountedSubscriber = false;
        options.ipcRenderer.removeListener(options.channels.hostMessage, mountedHandler);
      };
    },
  };

  return {
    bridge,
    bufferSync,
    bufferTextSelection,
    bufferEditorMessage,
    prepareMount,
    get hasMountedSubscriber() { return hasMountedSubscriber; },
    get hasPendingEditorMessage() { return pendingEditorMessage != null; },
  };
}

export { createAnnotationPreloadBridge };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadBridge };
