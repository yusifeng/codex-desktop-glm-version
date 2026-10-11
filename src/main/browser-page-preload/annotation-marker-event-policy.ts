function isPageAnnotationMarkerEvent(event: any, deps: { markerAttribute: string; isMarkerEvent: (event: any, attribute: string, policy: any) => boolean; policy: any }): boolean {
  return deps.isMarkerEvent(event, deps.markerAttribute, deps.policy);
}

export { isPageAnnotationMarkerEvent };
if (typeof module !== `undefined`) module.exports = { isPageAnnotationMarkerEvent };
