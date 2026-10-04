type WheelLikeEvent = { deltaMode: number; deltaX: number; deltaY: number };
type WheelDeltaDependencies = { lineMode: number; pageMode: number; lineScale: number };

function normalizeAnnotationWheelDelta(
  event: WheelLikeEvent,
  viewport: { innerWidth: number; innerHeight: number },
  dependencies: WheelDeltaDependencies,
) {
  if (event.deltaMode === dependencies.lineMode)
    return { x: event.deltaX * dependencies.lineScale, y: event.deltaY * dependencies.lineScale };
  if (event.deltaMode === dependencies.pageMode)
    return { x: event.deltaX * viewport.innerWidth, y: event.deltaY * viewport.innerHeight };
  return { x: event.deltaX, y: event.deltaY };
}

export { normalizeAnnotationWheelDelta };
if (typeof module !== `undefined`) module.exports = { normalizeAnnotationWheelDelta };
