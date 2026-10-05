type PreviewSchedulerDependencies = {
  windowLike: any;
  isElement: (value: any) => boolean;
  onInvalidate: () => void;
  onFrame: () => void;
};

/** Observer-backed candidate queue and RAF scheduler for annotation preview layers. */
function createAnnotationPreviewScheduler(deps: PreviewSchedulerDependencies) {
  const state = createAnnotationPreviewSchedulerState();
  const ResizeObserverConstructor = deps.windowLike.ResizeObserver ?? globalThis.ResizeObserver;
  const IntersectionObserverConstructor = deps.windowLike.IntersectionObserver ?? globalThis.IntersectionObserver;
  const resizeObserver = typeof ResizeObserverConstructor === `function` ? new ResizeObserverConstructor(() => invalidate()) : null;
  const intersectionObserver = typeof IntersectionObserverConstructor === `function` ? new IntersectionObserverConstructor((entries: any[]) => {
    for (const { target, isIntersecting } of entries) {
      if (!deps.isElement(target) || !state.candidates.has(target)) continue;
      if (isIntersecting) { state.visibleCandidates.add(target); resizeObserver?.observe(target); }
      else { state.visibleCandidates.delete(target); resizeObserver?.unobserve(target); }
    }
    invalidate();
  }) : null;
  function setCandidate(element: any, enabled: boolean) {
    if (enabled && !state.candidates.has(element)) { state.candidates.add(element); intersectionObserver?.observe(element); }
    else if (!enabled && state.candidates.delete(element)) { state.visibleCandidates.delete(element); intersectionObserver?.unobserve(element); resizeObserver?.unobserve(element); }
  }
  function schedule() { if (!state.disposed && state.frame == null) state.setFrame(deps.windowLike.requestAnimationFrame(() => { state.setFrame(null); if (!state.disposed) deps.onFrame(); })); }
  function invalidate() { if (state.disposed) return; deps.onInvalidate(); schedule(); }
  function dispose() {
    const frame = state.frame;
    if (!state.dispose()) return;
    if (frame != null) deps.windowLike.cancelAnimationFrame(frame);
    resizeObserver?.disconnect(); intersectionObserver?.disconnect();
  }
  return { setCandidate, getCandidates: () => state.candidates, getVisibleCandidates: () => state.visibleCandidates, observeDocumentElement: (element: any) => resizeObserver?.observe(element), unobserveDocumentElement: (element: any) => resizeObserver?.unobserve(element), schedule, invalidate, dispose };
}

export { createAnnotationPreviewScheduler };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreviewScheduler };
import { createAnnotationPreviewSchedulerState } from "./annotation-preview-scheduler-state";
