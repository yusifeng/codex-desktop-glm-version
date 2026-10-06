function stopAnnotationEventPropagation(event: any, deps: { preventDefault?: boolean } = {}): void {
  if (deps.preventDefault !== false) event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
}
export { stopAnnotationEventPropagation };
if (typeof module !== `undefined`) module.exports = { stopAnnotationEventPropagation };
