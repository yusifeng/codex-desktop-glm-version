function withAnnotationMarkerPointerEventsDisabled<T>(markers: any[], run: () => T, deps: { getPointerEvents: (element: any) => string; setPointerEvents: (element: any, value: string) => void }): T {
  const previous = markers.map((element) => deps.getPointerEvents(element));
  markers.forEach((element) => deps.setPointerEvents(element, `none`));
  try {
    return run();
  } finally {
    markers.forEach((element, index) => deps.setPointerEvents(element, previous[index] ?? ``));
  }
}

export { withAnnotationMarkerPointerEventsDisabled };
if (typeof module !== `undefined`) module.exports = { withAnnotationMarkerPointerEventsDisabled };
