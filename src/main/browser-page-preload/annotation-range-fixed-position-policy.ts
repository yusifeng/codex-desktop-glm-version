function isAnnotationRangeFixedPosition(value: any, deps: { isElement: (value: any) => boolean; getShadowHost: (value: any) => any; getParent: (value: any) => any; getStylePosition: (value: any) => string; getBody: () => any }): boolean {
  let current = deps.isElement(value) ? value : deps.getShadowHost(value);
  const body = deps.getBody();
  while (current != null && current !== body) {
    const position = deps.getStylePosition(current);
    if (position === `fixed` || position === `sticky`) return true;
    current = deps.getParent(current);
  }
  return false;
}
export { isAnnotationRangeFixedPosition };
if (typeof module !== `undefined`) module.exports = { isAnnotationRangeFixedPosition };
