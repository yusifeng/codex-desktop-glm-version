function hasAnnotationAncestorTransform(element: any, deps: { getStyle: (element: any) => any; getParent: (element: any) => any; getShadowHost: (element: any) => any }): boolean {
  for (let current = element; current != null; current = deps.getParent(current) ?? deps.getShadowHost(current)) {
    const style = deps.getStyle(current);
    const transform = style.transform;
    if (transform !== `` && transform !== `none`) {
      const match = /^matrix\(([^)]+)\)$/.exec(transform);
      if (match == null) return true;
      const values = match[1]?.split(`,`).map(Number);
      if (values?.length !== 6 || Math.abs(values[1] ?? 0) > 1e-6 || Math.abs(values[2] ?? 0) > 1e-6) return true;
    }
    const rotate = style.getPropertyValue(`rotate`);
    if (rotate !== `` && rotate !== `none` && rotate !== `0deg`) return true;
  }
  return false;
}
export { hasAnnotationAncestorTransform };
if (typeof module !== `undefined`) module.exports = { hasAnnotationAncestorTransform };
