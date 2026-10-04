type ViewportStateWindow = {
  innerWidth: number;
  innerHeight: number;
  scrollY: number;
  visualViewport?: { offsetLeft: number; offsetTop: number; scale: number } | null;
};

function readAnnotationViewportState(windowLike: ViewportStateWindow) {
  const visualViewport = windowLike.visualViewport;
  const hasVisualOffset = visualViewport != null &&
    (visualViewport.offsetLeft !== 0 || visualViewport.offsetTop !== 0 || visualViewport.scale !== 1);
  return {
    height: windowLike.innerHeight,
    scrollY: windowLike.scrollY,
    ...(hasVisualOffset ? {
      visualViewport: {
        offsetLeft: visualViewport.offsetLeft,
        offsetTop: visualViewport.offsetTop,
        scale: visualViewport.scale,
      },
    } : {}),
    width: windowLike.innerWidth,
  };
}

export { readAnnotationViewportState };
if (typeof module !== `undefined`) module.exports = { readAnnotationViewportState };
