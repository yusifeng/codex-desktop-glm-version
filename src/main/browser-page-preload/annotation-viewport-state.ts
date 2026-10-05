type ViewportStateWindow = {
  innerWidth: number;
  innerHeight: number;
  scrollY: number;
  visualViewport?: { offsetLeft: number; offsetTop: number; scale: number } | null;
};

function readAnnotationViewportState(windowLike: ViewportStateWindow) {
  const visualViewport = windowLike.visualViewport;
  const projectedVisualViewport = projectAnnotationVisualViewport(visualViewport);
  return {
    height: windowLike.innerHeight,
    scrollY: windowLike.scrollY,
    ...(projectedVisualViewport == null ? {} : { visualViewport: projectedVisualViewport }),
    width: windowLike.innerWidth,
  };
}

export { readAnnotationViewportState };
if (typeof module !== `undefined`) module.exports = { readAnnotationViewportState };
import { projectAnnotationVisualViewport } from "./annotation-visual-viewport-policy";
