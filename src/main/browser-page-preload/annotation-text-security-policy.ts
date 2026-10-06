function isAnnotationTextSecurityEnabled(element: any, deps: { getTextSecurity: (element: any) => string }): boolean {
  const value = deps.getTextSecurity(element);
  return value.length > 0 && value !== `none`;
}
export { isAnnotationTextSecurityEnabled };
if (typeof module !== `undefined`) module.exports = { isAnnotationTextSecurityEnabled };
