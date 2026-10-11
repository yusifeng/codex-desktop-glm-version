function isAnnotationEventTarget(event: any, target: any, deps: { getComposedPath: (event: any) => any[]; isBlocked: (event: any) => boolean }): boolean { return deps.getComposedPath(event).includes(target) && !deps.isBlocked(event); }
export { isAnnotationEventTarget };
if (typeof module !== `undefined`) module.exports = { isAnnotationEventTarget };
