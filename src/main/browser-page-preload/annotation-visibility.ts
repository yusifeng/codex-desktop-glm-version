type AnnotationVisibilityDependencies = { getComputedStyle: (element: any) => { visibility?: string; display?: string; contentVisibility?: string; opacity?: string }; getParent: (element: any) => any };
const isAnnotationElementVisible = (element: any, deps: AnnotationVisibilityDependencies) => {
  const ownStyle = deps.getComputedStyle(element);
  if (ownStyle.visibility === `hidden` || ownStyle.visibility === `collapse`) return false;
  for (let current = element; current != null; current = deps.getParent(current)) {
    const style = deps.getComputedStyle(current);
    if (style.display === `none` || style.contentVisibility === `hidden` || Number.parseFloat(style.opacity ?? ``) === 0) return false;
  }
  return true;
};
export { isAnnotationElementVisible };
if (typeof module !== `undefined`) module.exports = { isAnnotationElementVisible };
