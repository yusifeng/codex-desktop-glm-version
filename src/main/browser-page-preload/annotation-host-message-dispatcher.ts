/**
 * Dispatches host-to-page annotation messages after the message type has been
 * reduced to a lifecycle action.  The runtime owns state and object creation;
 * this boundary keeps the message protocol's side effects explicit and easy
 * to exercise without a browser document.
 */
type AnnotationHostMessageDispatcherOptions = {
  action: string;
  message: any;
  state: any;
  permissionController: { handleResult: (requestId: any, allowed: any) => void };
  runtimeMount: { setPreview: (preview: any) => void };
  preloadBridge: {
    bufferSync: (message: any) => void;
    bufferTextSelection: () => void;
    bufferEditorMessage: (message: any) => void;
  };
  siteAnnotationRequests: { clear: () => void } | null;
  setActiveEditor: (active: boolean) => void;
  applySync: (message: any) => void;
};

function dispatchAnnotationHostMessage(options: AnnotationHostMessageDispatcherOptions): boolean {
  const { action, message } = options;
  switch (action) {
    case `permission-result`:
      options.permissionController.handleResult(message.requestId, message.allowed);
      return true;
    case `preview`:
      options.runtimeMount.setPreview(
        options.state.canUseSiteAnnotationApi && !options.state.isAgentControllingBrowser
          ? message.preview
          : null,
      );
      return true;
    case `sync`:
      options.applySync(message);
      options.preloadBridge.bufferSync({
        ...message,
        canUseSiteAnnotationApi: options.state.canUseSiteAnnotationApi,
      });
      return true;
    case `capture-text-selection`:
      options.preloadBridge.bufferTextSelection();
      return true;
    case `queue-editor-message`:
      options.siteAnnotationRequests?.clear();
      options.preloadBridge.bufferEditorMessage(message);
      return true;
    case `close-editor`:
      options.setActiveEditor(false);
      options.siteAnnotationRequests?.clear();
      options.preloadBridge.bufferEditorMessage(message);
      return true;
    default:
      return false;
  }
}

export { dispatchAnnotationHostMessage };
if (typeof module !== `undefined`) module.exports = { dispatchAnnotationHostMessage };
