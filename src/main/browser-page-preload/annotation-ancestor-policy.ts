/** Returns whether value is the ancestor itself or nested below it. */
function isAnnotationDescendant(ancestor: any, value: any, getParent: (value: any) => any) {
  for (let current = value; current != null; current = getParent(current)) if (current === ancestor) return true;
  return false;
}
export { isAnnotationDescendant };
if (typeof module !== `undefined`) module.exports = { isAnnotationDescendant };
