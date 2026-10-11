type AnnotationAnchorObservationLifecycleDependencies = {
  visualViewport: any;
  observeFrames: (installFrameResources: (documentLike: any, windowLike: any) => () => void) => () => void;
  observeTextAnchors: (anchors: any[], onChange: () => void) => () => void;
  anchors: any[];
  installRootResources: () => () => void;
  installFrameResources: (documentLike: any, windowLike: any) => () => void;
  onViewportResize: () => void;
  onViewportScroll: () => void;
  onTextAnchorChange: () => void;
};

/** Owns registration order for the cross-frame anchor observation effect. */
function createAnnotationAnchorObservationLifecycle(dependencies: AnnotationAnchorObservationLifecycleDependencies) {
  let disposed = false;
  let rootCleanup: (() => void) | null = null;
  let frameCleanup: (() => void) | null = null;
  let textCleanup: (() => void) | null = null;
  const install = () => {
    if (disposed) return () => {};
    const viewport = dependencies.visualViewport;
    viewport?.addEventListener(`resize`, dependencies.onViewportResize);
    viewport?.addEventListener(`scroll`, dependencies.onViewportScroll);
    rootCleanup = dependencies.installRootResources();
    frameCleanup = dependencies.observeFrames(dependencies.installFrameResources);
    dependencies.onTextAnchorChange();
    textCleanup = dependencies.observeTextAnchors(dependencies.anchors, dependencies.onTextAnchorChange);
    return dispose;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    const viewport = dependencies.visualViewport;
    viewport?.removeEventListener(`resize`, dependencies.onViewportResize);
    viewport?.removeEventListener(`scroll`, dependencies.onViewportScroll);
    rootCleanup?.();
    frameCleanup?.();
    textCleanup?.();
    rootCleanup = null;
    frameCleanup = null;
    textCleanup = null;
  };
  return { install, dispose };
}

export { createAnnotationAnchorObservationLifecycle };
if (typeof module !== `undefined`) module.exports = { createAnnotationAnchorObservationLifecycle };
