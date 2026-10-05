type AnnotationPointerSelectionDependencies = {
  resolvePoint: (x: number, y: number, rootHost: any, mode: string) => any;
  canStartSelection: (x: number, y: number, rootHost: any) => boolean;
  isSelectionBlocked: (element: any) => boolean;
  clearSelection: () => void;
  createHighlight: (windowLike: any) => (() => void) | null;
  applySelection: (documentLike: any, nativeSelection: boolean, range?: any) => void;
  hideHover: (point: any, rootHost: any) => void;
  stopEvent: (event: any, options?: { preventDefault?: boolean }) => void;
  readSelection: (windowLike: any) => any;
  toViewportPoint: (windowLike: any, point: any) => any;
};

/** Coordinates pointer-driven text selection without owning React or DOM listeners. */
function createAnnotationPointerSelection(rootHost: any, callbacks: { onPointerModeChange: (active: boolean) => void; onPointerChange: (point: any) => void; onClearHover: () => void }, deps: AnnotationPointerSelectionDependencies) {
  let drag: { pointerId: number; frameWindow: any; disposeHighlight: () => void } | null = null;
  let disposed = false;
  const clearDrag = () => {
    drag?.disposeHighlight();
    drag = null;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearDrag();
  };
  const cancel = () => {
    if (disposed) return false;
    if (drag == null) return false;
    clearDrag();
    deps.clearSelection();
    return true;
  };
  const updatePointer = (point: any, enabled: boolean) => {
    if (disposed) return false;
    const range = enabled && point != null ? deps.resolvePoint(point.x, point.y, rootHost, `text`) : null;
    const active = enabled && (drag != null || (range != null && deps.canStartSelection(point.x, point.y, rootHost) && !deps.isSelectionBlocked(range)));
    callbacks.onPointerModeChange(active);
    if (active) {
      callbacks.onClearHover();
      callbacks.onPointerChange(point);
      deps.applySelection(range?.ownerDocument ?? rootHost.ownerDocument, true, range ?? undefined);
      if (point != null) deps.hideHover(point, rootHost);
    }
    return active;
  };
  return {
    get isDragging() { return drag != null; },
    updatePointer,
    dispose,
    cancel,
    disposeFrame(frameWindow: any) { if (drag?.frameWindow === frameWindow) dispose(); },
    handlePointerDown(frameWindow: any, event: any, point: any, allowSelection: boolean) {
      if (disposed) return false;
      const range = deps.resolvePoint(point.x, point.y, rootHost, `text`);
      if (!deps.canStartSelection(point.x, point.y, rootHost)) return false;
      if (!allowSelection || deps.isSelectionBlocked(range)) {
        deps.stopEvent(event, { preventDefault: false });
        return true;
      }
      deps.clearSelection();
      clearDrag();
      drag = { pointerId: event.pointerId, frameWindow, disposeHighlight: deps.createHighlight(frameWindow) ?? (() => {}) };
      updatePointer(point, true);
      deps.stopEvent(event, { preventDefault: false });
      return true;
    },
    handlePointerMove(frameWindow: any, event: any) {
      if (disposed) return false;
      if (drag?.pointerId !== event.pointerId) return false;
      if (!(event.buttons & 1)) return cancel();
      callbacks.onPointerChange(deps.toViewportPoint(frameWindow, { x: event.clientX, y: event.clientY }));
      deps.stopEvent(event, { preventDefault: false });
      return true;
    },
    handlePointerUp(event: any, onSelection: (selection: any) => void) {
      if (disposed) return false;
      if (!event.isTrusted || drag?.pointerId !== event.pointerId) return false;
      const frameWindow = drag.frameWindow;
      clearDrag();
      deps.stopEvent(event, { preventDefault: false });
      onSelection(deps.readSelection(frameWindow));
      return true;
    },
    handlePointerCancel(event: any) { return !disposed && drag?.pointerId === event.pointerId && cancel(); },
  };
}

export { createAnnotationPointerSelection };
if (typeof module !== `undefined`) module.exports = { createAnnotationPointerSelection };
