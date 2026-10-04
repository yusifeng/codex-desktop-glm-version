type AnnotationPreviewVisibilityDependencies = {
  getDocument?: (value: any) => any;
  getParent?: (value: any) => any;
  isElement?: (value: any) => boolean;
  getFrameElement?: (view: any) => any;
  getOwnerWindow?: (element: any) => any;
};

const isDescendant = (ancestor: any, value: any, getParent: (value: any) => any) => {
  for (let current = value; current != null; current = getParent(current)) {
    if (current === ancestor) return true;
  }
  return false;
};

const findTopModal = (doc: any, modals: any[], getParent: (value: any) => any) => {
  if (modals.length < 2) return modals[0];
  for (let current of [doc.activeElement, doc.elementFromPoint?.(0, 0)]) {
    for (; current?.shadowRoot?.activeElement != null; ) current = current.shadowRoot.activeElement;
    for (; current != null && current !== doc; ) {
      if (modals.includes(current)) return current;
      current = getParent(current);
    }
  }
  return undefined;
};

/**
 * Builds the visibility predicate used by the annotation preview overlay.
 * The predicate accounts for fullscreen/modal boundaries and overlapping
 * popovers, including elements reached through same-origin frame boundaries.
 */
const createAnnotationPreviewVisibilityPredicate = (
  roots: Iterable<any>,
  dependencies: AnnotationPreviewVisibilityDependencies = {},
) => {
  const getDocument = dependencies.getDocument ?? ((value: any) => (`host` in value ? value.ownerDocument : value));
  const getParent = dependencies.getParent ?? ((value: any) => value?.parentNode ?? null);
  const isElement = dependencies.isElement ?? ((value: any) => value != null && value.nodeType === 1);
  const getFrameElement = dependencies.getFrameElement ?? ((view: any) => view?.frameElement ?? null);
  const getOwnerWindow = dependencies.getOwnerWindow ?? ((element: any) => element?.ownerDocument?.defaultView);
  const byDocument = new Map<any, { boundaries: any[]; modals: any[]; popovers: Array<{ element: any; rect: any }> }>();

  for (const root of roots) {
    const doc = getDocument(root);
    const state = byDocument.get(doc) ?? { boundaries: [], modals: [], popovers: [] };
    byDocument.set(doc, state);
    if (doc.fullscreenElement != null) state.boundaries.push(doc.fullscreenElement);
    for (const element of doc.querySelectorAll?.(`dialog[open], [popover]`) ?? []) {
      if (element.matches?.(`:modal`)) state.modals.push(element);
      else if (element.matches?.(`:popover-open`)) {
        state.popovers.push({ element, rect: element.getBoundingClientRect() });
      }
    }
  }
  for (const [doc, state] of byDocument) {
    const modal = findTopModal(doc, state.modals, getParent);
    state.boundaries.push(...(modal == null ? state.modals : [modal]));
  }

  return (value: any) => {
    for (let current = value; current != null; ) {
      const state = byDocument.get(current.ownerDocument);
      if (state != null) {
        for (const boundary of state.boundaries) if (!isDescendant(boundary, current, getParent)) return false;
        let rect: any;
        for (const popover of state.popovers) {
          if (
            !isDescendant(popover.element, current, getParent) &&
            ((rect ??= current.getBoundingClientRect()),
              rect.left < popover.rect.right &&
                rect.right > popover.rect.left &&
                rect.top < popover.rect.bottom &&
                rect.bottom > popover.rect.top)
          )
            return false;
        }
      }
      const frame = getFrameElement(getOwnerWindow(current));
      current = isElement(frame) ? frame : null;
    }
    return true;
  };
};

export { createAnnotationPreviewVisibilityPredicate };
if (typeof module !== `undefined`) module.exports = { createAnnotationPreviewVisibilityPredicate };
