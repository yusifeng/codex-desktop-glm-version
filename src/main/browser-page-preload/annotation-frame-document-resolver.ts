function resolveAnnotationFrameDocument(framePath: any, deps: { resolveWindow: (framePath: any) => any }): any {
  const windowLike = deps.resolveWindow(framePath);
  return windowLike == null ? null : windowLike.document;
}
export { resolveAnnotationFrameDocument };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationFrameDocument };
