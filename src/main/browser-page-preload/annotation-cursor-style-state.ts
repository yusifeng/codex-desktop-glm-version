type AnnotationCursorStyleState = { element: any; cursor: string; priority: string };

function applyAnnotationCursorStyle(element: any, state: WeakMap<any, AnnotationCursorStyleState>, restore: (documentLike: any) => void): void {
  const documentLike = element.ownerDocument;
  if (state.get(documentLike)?.element !== element) restore(documentLike);
  const cursor = element.style.getPropertyValue(`cursor`);
  const priority = element.style.getPropertyPriority(`cursor`);
  if (cursor !== `none` || priority !== `important`) {
    state.set(documentLike, { element, cursor, priority });
    element.style.setProperty(`cursor`, `none`, `important`);
  }
}

function restoreAnnotationCursorStyle(documentLike: any, state: WeakMap<any, AnnotationCursorStyleState>): void {
  const previous = state.get(documentLike);
  if (previous == null) return;
  state.delete(documentLike);
  if (previous.element.style.getPropertyValue(`cursor`) === `none` && previous.element.style.getPropertyPriority(`cursor`) === `important`) previous.element.style.setProperty(`cursor`, previous.cursor, previous.priority);
}

export { applyAnnotationCursorStyle, restoreAnnotationCursorStyle };
if (typeof module !== `undefined`) module.exports = { applyAnnotationCursorStyle, restoreAnnotationCursorStyle };
