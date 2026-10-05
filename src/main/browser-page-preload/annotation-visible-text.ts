const MAX_VISIBLE_TEXT_LENGTH = 2_000;
const TEXT_NODE = 4;
const ACCEPT = 1;
const REJECT = 2;

/** Collects normalized visible text intersecting an annotation viewport. */
function collectAnnotationVisibleText(
  windowObject: any,
  viewportRect: any,
  dependencies: {
    getDocument: (value: any) => any;
    normalizeText: (value: unknown) => string | undefined;
    isHTMLElement: (value: any) => boolean;
    isVisibleElement: (value: any) => boolean;
    rangeIntersectsRect: (document: any, node: any, rect: any) => boolean;
  },
) {
  const documentObject = dependencies.getDocument(windowObject);
  const body = documentObject?.body;
  if (documentObject == null || body == null) return null;
  let text = ``;
  const walker = documentObject.createTreeWalker(body, TEXT_NODE, {
    acceptNode: (node: any) => {
      if (dependencies.normalizeText(node.textContent) == null) return REJECT;
      const parent = node.parentElement;
      return !dependencies.isHTMLElement(parent) || !dependencies.isVisibleElement(parent) ? REJECT : ACCEPT;
    },
  });
  let node = walker.nextNode();
  while (node != null) {
    const value = dependencies.normalizeText(node.textContent);
    if (value != null && dependencies.rangeIntersectsRect(documentObject, node, viewportRect)) {
      const appended = appendAnnotationVisibleText(text, value, MAX_VISIBLE_TEXT_LENGTH);
      text = appended.text;
      if (appended.complete) break;
    }
    node = walker.nextNode();
  }
  return dependencies.normalizeText(text);
}

export { collectAnnotationVisibleText, MAX_VISIBLE_TEXT_LENGTH };
if (typeof module !== `undefined`) module.exports = { collectAnnotationVisibleText, MAX_VISIBLE_TEXT_LENGTH };
import { appendAnnotationVisibleText } from "./annotation-visible-text-policy";
