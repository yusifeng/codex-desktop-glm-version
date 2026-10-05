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
  const state = createAnnotationPointerSelectionState();
  const clearDrag = () => {
    state.drag?.disposeHighlight();
    state.setDrag(null);
  };
  const dispose = () => {
    if (!state.dispose()) return;
    clearDrag();
  };
  const cancel = () => {
    if (state.disposed) return false;
    if (state.drag == null) return false;
    clearDrag();
    deps.clearSelection();
    return true;
  };
  const updatePointer = (point: any, enabled: boolean) => {
    if (state.disposed) return false;
    const range = enabled && point != null ? deps.resolvePoint(point.x, point.y, rootHost, `text`) : null;
    const active = enabled && (state.drag != null || (range != null && deps.canStartSelection(point.x, point.y, rootHost) && !deps.isSelectionBlocked(range)));
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
    get isDragging() { return state.drag != null; },
    updatePointer,
    dispose,
    cancel,
    disposeFrame(frameWindow: any) { if (state.drag?.frameWindow === frameWindow) dispose(); },
    handlePointerDown(frameWindow: any, event: any, point: any, allowSelection: boolean) {
      if (state.disposed) return false;
      const range = deps.resolvePoint(point.x, point.y, rootHost, `text`);
      if (!deps.canStartSelection(point.x, point.y, rootHost)) return false;
      if (!allowSelection || deps.isSelectionBlocked(range)) {
        deps.stopEvent(event, { preventDefault: false });
        return true;
      }
      deps.clearSelection();
      clearDrag();
      state.setDrag({ pointerId: event.pointerId, frameWindow, disposeHighlight: deps.createHighlight(frameWindow) ?? (() => {}) });
      updatePointer(point, true);
      deps.stopEvent(event, { preventDefault: false });
      return true;
    },
    handlePointerMove(frameWindow: any, event: any) {
      if (state.disposed) return false;
      if (state.drag?.pointerId !== event.pointerId) return false;
      if (!(event.buttons & 1)) return cancel();
      callbacks.onPointerChange(deps.toViewportPoint(frameWindow, { x: event.clientX, y: event.clientY }));
      deps.stopEvent(event, { preventDefault: false });
      return true;
    },
    handlePointerUp(event: any, onSelection: (selection: any) => void) {
      if (state.disposed) return false;
      if (!event.isTrusted || state.drag?.pointerId !== event.pointerId) return false;
      const frameWindow = state.drag.frameWindow;
      clearDrag();
      deps.stopEvent(event, { preventDefault: false });
      onSelection(deps.readSelection(frameWindow));
      return true;
    },
    handlePointerCancel(event: any) { return !state.disposed && state.drag?.pointerId === event.pointerId && cancel(); },
  };
}

export { createAnnotationPointerSelection };
if (typeof module !== `undefined`) module.exports = { createAnnotationPointerSelection };
import { createAnnotationPointerSelectionState } from "./annotation-pointer-selection-state";
