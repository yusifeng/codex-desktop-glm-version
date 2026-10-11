function getAnnotationAnchorSelector(element: any, deps: { resolveSelector: (element: any, options: { requireUnique: boolean }) => string | null }): string | null { return deps.resolveSelector(element, { requireUnique: true }); }
export { getAnnotationAnchorSelector };
if (typeof module !== `undefined`) module.exports = { getAnnotationAnchorSelector };
