function isAnnotationShadowHostRoot(value: any, deps: { fragmentNodeType: number; isElement: (value: any) => boolean }): boolean {
  return value?.nodeType === deps.fragmentNodeType && `host` in value && deps.isElement(value.host);
}
function getAnnotationShadowHost(value: any, deps: { isShadowRoot: (value: any) => boolean }): any {
  return deps.isShadowRoot(value) ? value.host : null;
}
export { isAnnotationShadowHostRoot, getAnnotationShadowHost };
if (typeof module !== `undefined`) module.exports = { isAnnotationShadowHostRoot, getAnnotationShadowHost };
