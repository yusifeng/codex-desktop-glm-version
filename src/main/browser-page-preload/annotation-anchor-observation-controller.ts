import { createAnnotationAnchorObservationLifecycle } from "./annotation-anchor-observation-lifecycle";

type InstallOptions = {
  editor: any;
  previewCommentId: string | null;
  annotations: any[];
  hasDisplayAnnotations: boolean;
  interactionMode: string;
  observeDocumentScroll: boolean;
  observeMutations: boolean;
  interactionLayer: any;
  rootHost: any;
};

type Dependencies = {
  windowLike: any;
  documentLike: any;
  isCurrentPage: (annotation: any) => boolean;
  mergeTextAnnotations: (annotations: any[], previous: any) => any;
  updateTextAnnotations: (update: (previous: any) => any) => void;
  refreshViewport: () => void;
  observeFrames: (install: (documentLike: any, windowLike: any) => () => void) => () => void;
  observeTextAnchors: (anchors: any[], onChange: () => void) => () => void;
  observeMutationsOutsideOverlay: (documentLike: any, rootHost: any, interactionLayer: any) => (() => void) | null;
  observeScrollContainers: (windowLike: any, anchors: any[], onChange: () => void) => () => void;
  flushSync: (callback: () => void) => void;
};

/** Owns Wy's text-anchor and viewport observation lifecycle. */
function createAnnotationAnchorObservationController(dependencies: Dependencies) {
  return {
    install(options: InstallOptions) {
      if (
        options.editor != null ||
        !options.hasDisplayAnnotations ||
        (options.interactionMode !== `comment` && options.previewCommentId == null)
      ) return;

      const textAnnotations = options.annotations.filter(
        (annotation) => annotation.anchor.kind === `text` && dependencies.isCurrentPage(annotation),
      );
      const syncTextAnnotations = () => {
        dependencies.updateTextAnnotations((previous) =>
          dependencies.mergeTextAnnotations(textAnnotations, previous),
        );
      };
      let pendingFrame: any = null;
      const scheduleTextSync = () => {
        pendingFrame ??= dependencies.windowLike.requestAnimationFrame(() => {
          pendingFrame = null;
          syncTextAnnotations();
        });
      };
      const onResize = () => {
        syncTextAnnotations();
        dependencies.flushSync(dependencies.refreshViewport);
      };
      const onFrameChange = () => {
        scheduleTextSync();
        dependencies.refreshViewport();
      };
      const allAnchors = options.annotations.flatMap((annotation) =>
        dependencies.isCurrentPage(annotation)
          ? [annotation.anchor, ...(annotation.additionalAnchors ?? [])]
          : [],
      );
      const lifecycle = createAnnotationAnchorObservationLifecycle({
        visualViewport: dependencies.windowLike.visualViewport,
        observeFrames: dependencies.observeFrames,
        observeTextAnchors: dependencies.observeTextAnchors,
        anchors: textAnnotations.map((annotation) => annotation.anchor),
        installRootResources: () => {
          dependencies.windowLike.addEventListener(`resize`, onResize);
          if (options.observeDocumentScroll) dependencies.documentLike.addEventListener(`scroll`, onFrameChange, true);
          const cleanupOverlay = options.observeMutations
            ? dependencies.observeMutationsOutsideOverlay(dependencies.documentLike, options.rootHost, options.interactionLayer)
            : null;
          const cleanupScrollContainers = dependencies.observeScrollContainers(
            dependencies.windowLike, allAnchors, onFrameChange,
          );
          return () => {
            dependencies.windowLike.removeEventListener(`resize`, onResize);
            if (options.observeDocumentScroll) dependencies.documentLike.removeEventListener(`scroll`, onFrameChange, true);
            cleanupOverlay?.();
            cleanupScrollContainers();
          };
        },
        installFrameResources: (frameDocument, frameWindow) => {
          if (frameWindow === dependencies.windowLike) return () => {};
          frameWindow.addEventListener(`resize`, onResize);
          frameWindow.addEventListener(`scroll`, onFrameChange);
          if (options.observeDocumentScroll) frameDocument.addEventListener(`scroll`, onFrameChange, true);
          const cleanupScrollContainers = dependencies.observeScrollContainers(frameWindow, allAnchors, onFrameChange);
          const cleanupOverlay = options.observeMutations
            ? dependencies.observeMutationsOutsideOverlay(frameDocument, options.rootHost, options.interactionLayer)
            : null;
          return () => {
            frameWindow.removeEventListener(`resize`, onResize);
            frameWindow.removeEventListener(`scroll`, onFrameChange);
            if (options.observeDocumentScroll) frameDocument.removeEventListener(`scroll`, onFrameChange, true);
            cleanupScrollContainers();
            cleanupOverlay?.();
          };
        },
        onViewportResize: scheduleTextSync,
        onViewportScroll: onFrameChange,
        onTextAnchorChange: syncTextAnnotations,
        cancelPendingFrame: () => {
          if (pendingFrame != null) dependencies.windowLike.cancelAnimationFrame(pendingFrame);
          pendingFrame = null;
        },
      });
      return lifecycle.install();
    },
  };
}

export { createAnnotationAnchorObservationController };
if (typeof module !== `undefined`) module.exports = { createAnnotationAnchorObservationController };
