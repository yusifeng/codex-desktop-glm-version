/** Owns active pointer drag and terminal state for annotation selection. */
function createAnnotationPointerSelectionState() {
  let drag: any = null;
  let disposed = false;
  return {
    get drag() { return drag; },
    get disposed() { return disposed; },
    setDrag(value: any) { drag = value; },
    dispose() { if (disposed) return false; disposed = true; drag = null; return true; },
  };
}
export { createAnnotationPointerSelectionState };
if (typeof module !== `undefined`) module.exports = { createAnnotationPointerSelectionState };
