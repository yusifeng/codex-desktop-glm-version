type AnnotationFrameWindowResolverDependencies = {
  getRootWindow: () => any;
  getRootDocument: () => any;
  resolveFrameElement: (documentLike: any, selector: string) => any;
  getFrameWindow: (frame: any) => any;
  getDocument: (windowLike: any) => any;
};

function resolveAnnotationFrameWindow(framePath: readonly string[], deps: AnnotationFrameWindowResolverDependencies): any {
  let windowLike = deps.getRootWindow();
  let documentLike = deps.getRootDocument();
  for (const selector of framePath) {
    const frame = deps.resolveFrameElement(documentLike, selector);
    if (frame == null) return null;
    const childWindow = deps.getFrameWindow(frame);
    if (childWindow == null) return null;
    windowLike = childWindow;
    documentLike = deps.getDocument(childWindow);
  }
  return windowLike;
}

export { resolveAnnotationFrameWindow };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationFrameWindow };
