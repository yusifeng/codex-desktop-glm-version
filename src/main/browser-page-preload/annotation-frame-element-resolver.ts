function resolveAnnotationFrameElement(documentLike: any, selector: string, deps: { querySelector: (documentLike: any, selector: string) => any; isIframe: (value: any) => boolean }): any {
  const element = deps.querySelector(documentLike, selector);
  return deps.isIframe(element) ? element : null;
}
export { resolveAnnotationFrameElement };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationFrameElement };
