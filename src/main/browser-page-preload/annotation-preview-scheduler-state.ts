/** Mutable candidate/frame state for the annotation preview scheduler. */
function createAnnotationPreviewSchedulerState() {
  const candidates = new Set<any>();
  const visibleCandidates = new Set<any>();
  let frame: any = null;
  let disposed = false;
  return {
    candidates,
    visibleCandidates,
    get frame() { return frame; },
    get disposed() { return disposed; },
    setFrame(value: any) { frame = value; },
    dispose() {
      if (disposed) return false;
      disposed = true;
      frame = null;
      candidates.clear();
      visibleCandidates.clear();
      return true;
    },
  };
}

export { createAnnotationPreviewSchedulerState };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreviewSchedulerState };
