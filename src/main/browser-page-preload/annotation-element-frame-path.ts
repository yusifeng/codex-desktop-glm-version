function getAnnotationElementFramePath(element: any, deps: { getOwnerWindow: (element: any) => any; resolveFramePath: (windowLike: any) => any }): any { return deps.resolveFramePath(deps.getOwnerWindow(element)); }
export { getAnnotationElementFramePath };
if (typeof module !== `undefined`) module.exports = { getAnnotationElementFramePath };
