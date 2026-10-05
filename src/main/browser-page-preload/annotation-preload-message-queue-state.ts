/** Mutable pre-mount message buffers and lifecycle flags. */
function createAnnotationPreloadMessageQueueState() {
  let destroyed = false;
  let mounted = false;
  let bufferedSync: any = null;
  let pendingTextSelection = false;
  let pendingEditorMessage: any = null;
  return {
    get destroyed() { return destroyed; },
    get mounted() { return mounted; },
    get bufferedSync() { return bufferedSync; },
    get pendingTextSelection() { return pendingTextSelection; },
    get pendingEditorMessage() { return pendingEditorMessage; },
    setMounted(value: boolean) { mounted = value === true; },
    setBufferedSync(value: any) { bufferedSync = value; },
    setPendingTextSelection(value: boolean) { pendingTextSelection = value === true; },
    setPendingEditorMessage(value: any) { pendingEditorMessage = value; },
    dispose() { destroyed = true; mounted = false; bufferedSync = null; pendingTextSelection = false; pendingEditorMessage = null; },
  };
}
export { createAnnotationPreloadMessageQueueState };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreloadMessageQueueState };
