function resolveAnnotationTextTarget(x: number, y: number, root: any, deps: { hitTest: (x: number, y: number, root: any) => any; getContainerAncestor: (element: any) => any }): any { const element = deps.hitTest(x, y, root); return element == null ? null : deps.getContainerAncestor(element); }
export { resolveAnnotationTextTarget };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationTextTarget };
