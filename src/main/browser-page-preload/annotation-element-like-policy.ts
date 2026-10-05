function isAnnotationElementLike(value: any, deps: { getOwnerWindow: (value: any) => any; getFallbackHTMLElement: () => any; getFallbackNode: () => any; getElementNodeType: () => number }): boolean {
  if (typeof value !== `object` || value == null) return false;
  const ownerWindow = deps.getOwnerWindow(value);
  const HTMLElementCtor = ownerWindow?.HTMLElement ?? deps.getFallbackHTMLElement();
  if (HTMLElementCtor != null && value instanceof HTMLElementCtor) return true;
  const NodeCtor = ownerWindow?.Node ?? deps.getFallbackNode();
  return NodeCtor != null && value.nodeType === deps.getElementNodeType() && value.ownerDocument != null && typeof value.getBoundingClientRect === `function` && typeof value.tagName === `string`;
}

export { isAnnotationElementLike };
if (typeof module !== `undefined`) module.exports = { isAnnotationElementLike };
