type WheelDeltaInput = { deltaMode: number; deltaX: number; deltaY: number };
function projectAnnotationWheelDelta(event: WheelDeltaInput, viewport: { innerWidth: number; innerHeight: number }, deps: { lineMode: number; pageMode: number; lineScale: number }) {
  if (event.deltaMode === deps.lineMode) return { x: event.deltaX * deps.lineScale, y: event.deltaY * deps.lineScale };
  if (event.deltaMode === deps.pageMode) return { x: event.deltaX * viewport.innerWidth, y: event.deltaY * viewport.innerHeight };
  return { x: event.deltaX, y: event.deltaY };
}
export { projectAnnotationWheelDelta };
if (typeof module !== `undefined`) module.exports = { projectAnnotationWheelDelta };
