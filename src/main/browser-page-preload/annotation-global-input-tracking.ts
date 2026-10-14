type AnnotationGlobalInputTrackingDependencies = {
  observeFrames: (
    install: (documentLike: any, windowLike: any) => (() => void) | void,
  ) => (() => void) | void;
  isTrusted: (event: any) => boolean;
  toViewportPoint: (windowLike: any, point: { x: number; y: number }) => any;
  onKeyDown: (event: any) => void;
  onKeyUp: (event: any) => void;
  onPointerMove: (point: any) => void;
  onBlur: () => void;
  hasFocus: () => boolean;
  clearTransientModifierState: () => void;
};

/** Owns the cross-frame keyboard, mouse-position and focus listeners used by Wy. */
function createAnnotationGlobalInputTracking(
  dependencies: AnnotationGlobalInputTrackingDependencies,
) {
  let disposed = false;

  const install = () => {
    if (disposed) return () => {};
    const cleanup = dependencies.observeFrames((documentLike, windowLike) => {
      if (disposed) return () => {};
      const onMouseMove = (event: any) => {
        if (dependencies.isTrusted(event)) {
          dependencies.onPointerMove(
            dependencies.toViewportPoint(windowLike, { x: event.clientX, y: event.clientY }),
          );
        }
      };
      const onBlur = () => {
        dependencies.onBlur();
        if (!dependencies.hasFocus()) dependencies.clearTransientModifierState();
      };
      windowLike.addEventListener("keydown", dependencies.onKeyDown, true);
      windowLike.addEventListener("keyup", dependencies.onKeyUp, true);
      windowLike.addEventListener("mousemove", onMouseMove, true);
      windowLike.addEventListener("blur", onBlur);
      return () => {
        windowLike.removeEventListener("keydown", dependencies.onKeyDown, true);
        windowLike.removeEventListener("keyup", dependencies.onKeyUp, true);
        windowLike.removeEventListener("mousemove", onMouseMove, true);
        windowLike.removeEventListener("blur", onBlur);
      };
    });
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  };

  const dispose = () => {
    disposed = true;
  };

  return { install, dispose };
}

export { createAnnotationGlobalInputTracking };
if (typeof module !== "undefined") module.exports = { createAnnotationGlobalInputTracking };
