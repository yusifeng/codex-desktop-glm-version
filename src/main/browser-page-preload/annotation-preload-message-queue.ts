type AnnotationPreloadMessageQueueOptions = {
  reducePendingEditorMessage: (pending: any, message: any) => any;
};

/** Owns pre-mount host messages and their one-shot replay semantics. */
function createAnnotationPreloadMessageQueue(options: AnnotationPreloadMessageQueueOptions) {
  let destroyed = false;
  let mounted = false;
  let bufferedSync: any = null;
  let pendingTextSelection = false;
  let pendingEditorMessage: any = null;

  return {
    markMounted() { mounted = true; },
    markUnmounted() { mounted = false; },
    bufferSync(message: any) { if (!destroyed && !mounted) bufferedSync = message; },
    bufferTextSelection() { if (!destroyed && !mounted) pendingTextSelection = true; },
    bufferEditorMessage(message: any) {
      if (destroyed) return;
      if (!mounted) pendingEditorMessage = options.reducePendingEditorMessage(pendingEditorMessage, message);
    },
    prepareMount() { bufferedSync = null; },
    consume(listener: (message: any) => void) {
      if (bufferedSync != null) { listener(bufferedSync); bufferedSync = null; }
      if (pendingTextSelection) { listener({ type: `browser-sidebar-runtime-capture-text-selection` }); pendingTextSelection = false; }
      if (pendingEditorMessage != null) { listener(pendingEditorMessage); pendingEditorMessage = null; }
    },
    dispose() { destroyed = true; mounted = false; bufferedSync = null; pendingTextSelection = false; pendingEditorMessage = null; },
    get hasPendingEditorMessage() { return pendingEditorMessage != null; },
  };
}

export { createAnnotationPreloadMessageQueue };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadMessageQueue };
