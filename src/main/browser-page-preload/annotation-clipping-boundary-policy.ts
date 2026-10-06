function isAnnotationClippingBoundary(element: any, deps: { getStyle: (element: any) => { overflow?: string; overflowX?: string; overflowY?: string }; isClippingOverflow: (value: string | undefined) => boolean }): boolean {
  const style = deps.getStyle(element);
  return [style.overflow, style.overflowX, style.overflowY].some((value) => deps.isClippingOverflow(value));
}

export { isAnnotationClippingBoundary };
if (typeof module !== `undefined`) module.exports = { isAnnotationClippingBoundary };
