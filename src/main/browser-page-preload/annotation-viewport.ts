type ViewportWindow = { innerWidth: number; innerHeight: number };

function readAnnotationViewportSize(windowLike: ViewportWindow) {
  return { height: windowLike.innerHeight, width: windowLike.innerWidth };
}

export { readAnnotationViewportSize };
if (typeof module !== `undefined`) module.exports = { readAnnotationViewportSize };
