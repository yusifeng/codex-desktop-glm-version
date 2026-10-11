function resolveAnnotationHitTargetWithFallback(element: any, point: any, deps: { resolve: (element: any, point: any) => any; fallback: (element: any) => any }): any {
  const resolved = deps.resolve(element, point);
  return resolved === undefined ? deps.fallback(element) : resolved;
}

export { resolveAnnotationHitTargetWithFallback };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationHitTargetWithFallback };
