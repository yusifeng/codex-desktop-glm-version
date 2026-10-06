function isAnnotationIframeElement(value: any, deps: { getOwnerWindow: (value: any) => any; getFallbackIframe: () => any }): boolean {
  if (typeof value !== `object` || value == null) return false;
  const IframeCtor = deps.getOwnerWindow(value)?.HTMLIFrameElement ?? deps.getFallbackIframe();
  return (IframeCtor != null && value instanceof IframeCtor) || (value.tagName?.toLowerCase() === `iframe` && `contentWindow` in value);
}

export { isAnnotationIframeElement };
if (typeof module !== `undefined`) module.exports = { isAnnotationIframeElement };
