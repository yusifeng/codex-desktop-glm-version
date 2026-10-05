/** Finds the topmost open modal from focus/point context. */
function findAnnotationTopModal(doc: any, modals: any[], getParent: (value: any) => any) {
  if (modals.length < 2) return modals[0];
  for (let current of [doc.activeElement, doc.elementFromPoint?.(0, 0)]) {
    for (; current?.shadowRoot?.activeElement != null; ) current = current.shadowRoot.activeElement;
    for (; current != null && current !== doc; ) {
      if (modals.includes(current)) return current;
      current = getParent(current);
    }
  }
  return undefined;
}
export { findAnnotationTopModal };
if (typeof module !== `undefined`) module.exports = { findAnnotationTopModal };
