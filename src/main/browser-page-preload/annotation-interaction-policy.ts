/** Pure event/path gates used by the annotation pointer runtime. */
type AnnotationInteractionPolicyDependencies = {
  isElement: (value: unknown) => boolean;
  closest: (element: any, selector: string) => any;
  getRootNode: (element: any) => any;
  isShadowRoot: (value: unknown) => boolean;
  getShadowHost: (root: any) => any;
  getComposedPath: (event: any) => unknown[];
  hasAttribute: (element: any, attribute: string) => boolean;
};

function isAnnotationOverlayElement(element: any, rootId: string, deps: AnnotationInteractionPolicyDependencies): boolean {
  if (!deps.isElement(element)) return false;
  if (element.id === rootId || deps.closest(element, `#${rootId}`) != null) return true;
  const root = deps.getRootNode(element);
  const host = deps.isShadowRoot(root) ? deps.getShadowHost(root) : null;
  return deps.isElement(host) && host.id === rootId;
}

function isAnnotationInteractionBlocked(event: any, blockerAttribute: string, deps: AnnotationInteractionPolicyDependencies): boolean {
  return deps.getComposedPath(event).some((value) => deps.isElement(value) && deps.hasAttribute(value, blockerAttribute));
}

function isAnnotationMarkerEvent(event: any, markerAttribute: string, deps: AnnotationInteractionPolicyDependencies): boolean {
  return deps.getComposedPath(event).some((value) => deps.isElement(value) && deps.hasAttribute(value, markerAttribute));
}

export { isAnnotationInteractionBlocked, isAnnotationMarkerEvent, isAnnotationOverlayElement };
if (typeof module !== `undefined`) module.exports = { isAnnotationInteractionBlocked, isAnnotationMarkerEvent, isAnnotationOverlayElement };
