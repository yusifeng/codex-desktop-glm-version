function isPageAnnotationInteractionBlocked(event: any, deps: { blockerAttribute: string; isBlocked: (event: any, attribute: string, policy: any) => boolean; policy: any }): boolean {
  return deps.isBlocked(event, deps.blockerAttribute, deps.policy);
}

export { isPageAnnotationInteractionBlocked };
if (typeof module !== `undefined`) module.exports = { isPageAnnotationInteractionBlocked };
