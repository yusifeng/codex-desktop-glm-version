type AnnotationVisibilityDependencies = { getComputedStyle: (element: any) => { visibility?: string; display?: string; contentVisibility?: string; opacity?: string }; getParent: (element: any) => any };
const isAnnotationElementVisible = (element: any, deps: AnnotationVisibilityDependencies) => {
  for (let current = element; current != null; current = deps.getParent(current)) {
    const style = deps.getComputedStyle(current);
    if (
      style.visibility === `hidden` ||
      style.visibility === `collapse` ||
      style.display === `none` ||
      style.contentVisibility === `hidden` ||
      Number.parseFloat(style.opacity ?? ``) === 0
    ) return false;
  }
  return true;
};
export { isAnnotationElementVisible };
if (typeof module !== `undefined`) module.exports = { isAnnotationElementVisible };
