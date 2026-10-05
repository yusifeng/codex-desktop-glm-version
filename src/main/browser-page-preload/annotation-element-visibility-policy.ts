function isAnnotationElementVisibleByPolicy(element: any, deps: { getParent: (value: any) => any; getComputedStyle: (value: any) => { display?: string; visibility?: string; opacity?: string }; checkVisibility?: (value: any) => boolean }): boolean {
  for (let current = element; current != null; current = deps.getParent(current)) { const style = deps.getComputedStyle(current); if (style.display === `none` || style.visibility === `hidden` || style.visibility === `collapse` || Number.parseFloat(style.opacity ?? ``) === 0) return false; }
  return deps.checkVisibility == null ? true : deps.checkVisibility(element);
}
export { isAnnotationElementVisibleByPolicy };
if (typeof module !== `undefined`) module.exports = { isAnnotationElementVisibleByPolicy };
