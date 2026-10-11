function resolveAnnotationPointerTarget(eventPoint: any, target: any, markerEvent: any, options: any, deps: { isMarker: (event: any) => boolean; resolveMarker: (point: any, target: any, options: any) => any; resolvePoint: (x: number, y: number, options: any, target: any) => any }): any {
  return deps.isMarker(markerEvent) ? deps.resolveMarker(eventPoint, target, options) : deps.resolvePoint(eventPoint.x, eventPoint.y, options, target);
}

export { resolveAnnotationPointerTarget };
if (typeof module !== `undefined`) module.exports = { resolveAnnotationPointerTarget };
