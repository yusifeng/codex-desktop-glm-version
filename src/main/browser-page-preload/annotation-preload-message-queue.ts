type AnnotationPreloadMessageQueueOptions = {
  reducePendingEditorMessage: (pending: any, message: any) => any;
};

/** Owns pre-mount host messages and their one-shot replay semantics. */
function createAnnotationPreloadMessageQueue(options: AnnotationPreloadMessageQueueOptions) {
  const state = createAnnotationPreloadMessageQueueState();

  return {
    markMounted() { state.setMounted(true); },
    markUnmounted() { state.setMounted(false); },
    bufferSync(message: any) { if (!state.destroyed && !state.mounted) state.setBufferedSync(message); },
    bufferTextSelection() { if (!state.destroyed && !state.mounted) state.setPendingTextSelection(true); },
    bufferEditorMessage(message: any) {
      if (state.destroyed) return;
      if (!state.mounted) state.setPendingEditorMessage(options.reducePendingEditorMessage(state.pendingEditorMessage, message));
    },
    prepareMount() { state.setBufferedSync(null); },
    consume(listener: (message: any) => void) {
      if (state.bufferedSync != null) { listener(state.bufferedSync); state.setBufferedSync(null); }
      if (state.pendingTextSelection) { listener({ type: `browser-sidebar-runtime-capture-text-selection` }); state.setPendingTextSelection(false); }
      if (state.pendingEditorMessage != null) { listener(state.pendingEditorMessage); state.setPendingEditorMessage(null); }
    },
    dispose() { state.dispose(); },
    get hasPendingEditorMessage() { return state.pendingEditorMessage != null; },
  };
}

export { createAnnotationPreloadMessageQueue };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadMessageQueue };
import { createAnnotationPreloadMessageQueueState } from "./annotation-preload-message-queue-state";
