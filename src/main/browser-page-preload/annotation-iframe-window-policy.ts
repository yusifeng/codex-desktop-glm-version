function resolveAnnotationIframeWindow(element: any, deps: { isIframe: (value: any) => boolean }): any {
  if (!deps.isIframe(element)) return null;
  try {
    const windowLike = element.contentWindow;
    return windowLike?.document == null ? null : windowLike;
  } catch {
    return null;
  }
}

export { resolveAnnotationIframeWindow };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationIframeWindow };
