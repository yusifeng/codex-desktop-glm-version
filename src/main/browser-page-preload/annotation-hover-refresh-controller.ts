type HoverRefreshDependencies = {
  enabled: () => boolean;
  getPointer: () => any;
  isSurfaceAtPointer: (pointer: any) => boolean;
  resolveHover: (pointer: any) => any;
  setHover: (value: any) => void;
  clearSelectionHover: () => void;
  refreshViewport: () => void;
  installFrames: (install: (documentLike: any, windowLike: any) => () => void) => () => void;
  flushResize?: (refresh: () => void) => void;
  debounceMs: number;
  setTimeout: (callback: () => void, delay: number) => any;
  clearTimeout: (handle: any) => void;
};

/** Refreshes comment hover anchors when the page viewport or scroll position changes. */
function createAnnotationHoverRefreshController(dependencies: HoverRefreshDependencies) {
  let timer: any = null;
  let disposed = false;

  const refreshHover = () => {
    if (disposed || !dependencies.enabled()) return;
    const pointer = dependencies.getPointer();
    if (dependencies.isSurfaceAtPointer(pointer)) {
      dependencies.setHover(null);
      dependencies.clearSelectionHover();
      return;
    }
    const hover = dependencies.resolveHover(pointer);
    dependencies.setHover(hover);
    dependencies.clearSelectionHover();
    if (hover != null) dependencies.refreshViewport();
  };

  const onScroll = () => {
    if (disposed || !dependencies.enabled()) return;
    if (timer != null) dependencies.clearTimeout(timer);
    dependencies.setHover(null);
    dependencies.clearSelectionHover();
    dependencies.refreshViewport();
    timer = dependencies.setTimeout(() => {
      timer = null;
      refreshHover();
    }, dependencies.debounceMs);
  };

  const install = () => {
    if (disposed) return () => {};
    const cleanupFrames = dependencies.installFrames((documentLike, windowLike) => {
      const onResize = () => {
        if (dependencies.flushResize) dependencies.flushResize(refreshHover);
        else refreshHover();
      };
      windowLike.addEventListener(`resize`, onResize);
      documentLike.addEventListener(`scroll`, onScroll, true);
      return () => {
        windowLike.removeEventListener(`resize`, onResize);
        documentLike.removeEventListener(`scroll`, onScroll, true);
      };
    });
    return () => {
      cleanupFrames();
      if (timer != null) dependencies.clearTimeout(timer);
      timer = null;
    };
  };

  return {
    install,
    dispose() {
      disposed = true;
      if (timer != null) dependencies.clearTimeout(timer);
      timer = null;
    },
  };
}

export { createAnnotationHoverRefreshController };
if (typeof module !== `undefined`) module.exports = { createAnnotationHoverRefreshController };
