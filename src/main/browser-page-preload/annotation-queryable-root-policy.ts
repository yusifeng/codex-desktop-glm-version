function isAnnotationQueryableRoot(value: any, deps: { documentNodeType: number; fragmentNodeType: number }): boolean {
  return value?.nodeType === deps.documentNodeType || (value?.nodeType === deps.fragmentNodeType && `querySelectorAll` in value);
}
export { isAnnotationQueryableRoot };
if (typeof module !== `undefined`) module.exports = { isAnnotationQueryableRoot };
