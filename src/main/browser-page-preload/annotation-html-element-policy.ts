function isAnnotationHtmlElement(value: any, deps: { getOwnerWindow: (value: any) => any; getFallbackHTMLElement: () => any }): boolean {
  if (value == null) return false;
  const ctor = deps.getOwnerWindow(value)?.HTMLElement ?? deps.getFallbackHTMLElement();
  return ctor != null && value instanceof ctor;
}
export { isAnnotationHtmlElement };
if (typeof module !== `undefined`) module.exports = { isAnnotationHtmlElement };
