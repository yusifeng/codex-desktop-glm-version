/** Owns frame pointer-style snapshots and observed-root membership. */
function createAnnotationFramePointerGuardState() {
  const savedStyles = new Map<any, { value: string; priority: string }>();
  const observedRoots = new Set<any>();
  return {
    savedStyles,
    observedRoots,
    remember(frame: any, value: { value: string; priority: string }) { savedStyles.set(frame, value); },
    forget(frame: any) { savedStyles.delete(frame); },
    has(frame: any) { return savedStyles.has(frame); },
    observe(root: any) { if (observedRoots.has(root)) return false; observedRoots.add(root); return true; },
  };
}
export { createAnnotationFramePointerGuardState };
if (typeof module !== `undefined`) module.exports = { createAnnotationFramePointerGuardState };
