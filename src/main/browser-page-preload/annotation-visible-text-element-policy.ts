function isAnnotationVisibleTextElement(element: any, deps: { hasExcludedAncestor: (element: any) => boolean; getStyle: (element: any) => { display?: string; visibility?: string; opacity?: string } }): boolean {
  if (deps.hasExcludedAncestor(element)) return false;
  const style = deps.getStyle(element);
  return style.display !== `none` && style.visibility !== `hidden` && style.opacity !== `0`;
}
export { isAnnotationVisibleTextElement };
if (typeof module !== `undefined`) module.exports = { isAnnotationVisibleTextElement };
