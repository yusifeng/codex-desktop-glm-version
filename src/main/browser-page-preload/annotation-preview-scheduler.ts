type PreviewSchedulerDependencies = {
  windowLike: any;
  isElement: (value: any) => boolean;
  onInvalidate: () => void;
  onFrame: () => void;
};

/** Observer-backed candidate queue and RAF scheduler for annotation preview layers. */
function createAnnotationPreviewScheduler(deps: PreviewSchedulerDependencies) {
  const candidates = new Set<any>();
  const visibleCandidates = new Set<any>();
  let frame: any = null;
  let disposed = false;
  const ResizeObserverConstructor = deps.windowLike.ResizeObserver ?? globalThis.ResizeObserver;
  const IntersectionObserverConstructor = deps.windowLike.IntersectionObserver ?? globalThis.IntersectionObserver;
  const resizeObserver = typeof ResizeObserverConstructor === `function` ? new ResizeObserverConstructor(() => invalidate()) : null;
  const intersectionObserver = typeof IntersectionObserverConstructor === `function` ? new IntersectionObserverConstructor((entries: any[]) => {
    for (const { target, isIntersecting } of entries) {
      if (!deps.isElement(target) || !candidates.has(target)) continue;
      if (isIntersecting) { visibleCandidates.add(target); resizeObserver?.observe(target); }
      else { visibleCandidates.delete(target); resizeObserver?.unobserve(target); }
    }
    invalidate();
  }) : null;
  function setCandidate(element: any, enabled: boolean) {
    if (enabled && !candidates.has(element)) { candidates.add(element); intersectionObserver?.observe(element); }
    else if (!enabled && candidates.delete(element)) { visibleCandidates.delete(element); intersectionObserver?.unobserve(element); resizeObserver?.unobserve(element); }
  }
  function schedule() { if (!disposed && frame == null) frame = deps.windowLike.requestAnimationFrame(() => { frame = null; if (!disposed) deps.onFrame(); }); }
  function invalidate() { if (disposed) return; deps.onInvalidate(); schedule(); }
  function dispose() { disposed = true; if (frame != null) deps.windowLike.cancelAnimationFrame(frame); frame = null; resizeObserver?.disconnect(); intersectionObserver?.disconnect(); candidates.clear(); visibleCandidates.clear(); }
  return { setCandidate, getCandidates: () => candidates, getVisibleCandidates: () => visibleCandidates, observeDocumentElement: (element: any) => resizeObserver?.observe(element), unobserveDocumentElement: (element: any) => resizeObserver?.unobserve(element), schedule, invalidate, dispose };
}

export { createAnnotationPreviewScheduler };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreviewScheduler };
