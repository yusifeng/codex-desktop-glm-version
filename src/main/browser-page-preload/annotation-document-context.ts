const MAX_VISIBLE_TEXT_LENGTH = 2_000;
const TEXT_NODE = 4;
const ACCEPT = 1;
const REJECT = 2;

function createAnnotationDocumentContext(dependencies: {
  parseGoogleDocsUrl: (value: unknown) => unknown;
  createGoogleDocsContext: (input: any) => unknown;
  normalizeText: (value: unknown) => string | undefined;
  getDocument: (value: any) => any;
  isHTMLElement: (value: any) => boolean;
  isVisibleElement: (value: any) => boolean;
  rangeIntersectsRect: (document: any, node: any, rect: any) => boolean;
}) {
  const { parseGoogleDocsUrl, createGoogleDocsContext, normalizeText, getDocument, isHTMLElement, isVisibleElement, rangeIntersectsRect } = dependencies;

  class AnnotationDocumentContext {
    pageUrl: unknown;

    constructor(pageUrl: unknown) {
      this.pageUrl = pageUrl;
    }

    isGoogleDocsPage() {
      return parseGoogleDocsUrl(this.pageUrl) != null;
    }

    getDocumentContext({ documentTitle, selectedText, visibleText }: any) {
      return createGoogleDocsContext({ documentTitle, pageUrl: this.pageUrl, selectedText, visibleText });
    }

    getElementDocumentContext({ documentTitle, elementWindow, fallbackWindow }: any) {
      return this.getDocumentContext({
        documentTitle,
        selectedText: this.getWindowSelectionText(elementWindow) ?? this.getWindowSelectionText(fallbackWindow),
      });
    }

    getRegionDocumentContext({ documentTitle, fallbackWindow, frameWindow, viewportRect }: any) {
      if (!this.isGoogleDocsPage()) return undefined;
      return this.getDocumentContext({
        documentTitle,
        selectedText: this.getWindowSelectionText(frameWindow) ?? this.getWindowSelectionText(fallbackWindow),
        visibleText: this.getVisibleTextInViewportRect(frameWindow, viewportRect),
      });
    }

    static isGoogleDocsAnchor(anchor: any) {
      return anchor?.documentContext?.kind === `google-docs` || parseGoogleDocsUrl(anchor?.pageUrl) != null;
    }

    getWindowSelectionText(windowObject: any) {
      try {
        return normalizeText(windowObject?.getSelection?.()?.toString()) ?? this.getActiveElementSelectionText(windowObject);
      } catch {
        return null;
      }
    }

    getActiveElementSelectionText(windowObject: any) {
      const activeElement = windowObject?.document?.activeElement;
      if (!isHTMLElement(activeElement)) return null;
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      return start == null || end == null || end <= start ? null : normalizeText(activeElement.value?.slice(start, end));
    }

    getVisibleTextInViewportRect(windowObject: any, viewportRect: any) {
      const documentObject = getDocument(windowObject);
      const body = documentObject?.body;
      if (documentObject == null || body == null) return null;
      let text = ``;
      const walker = documentObject.createTreeWalker(body, TEXT_NODE, {
        acceptNode: (node: any) => {
          if (normalizeText(node.textContent) == null) return REJECT;
          const parent = node.parentElement;
          return !isHTMLElement(parent) || !isVisibleElement(parent) ? REJECT : ACCEPT;
        },
      });
      let node = walker.nextNode();
      while (node != null) {
        const value = normalizeText(node.textContent);
        if (value != null && rangeIntersectsRect(documentObject, node, viewportRect)) {
          text = text.length === 0 ? value : `${text} ${value}`;
          if (text.length >= MAX_VISIBLE_TEXT_LENGTH) break;
        }
        node = walker.nextNode();
      }
      return normalizeText(text);
    }
  }

  return { AnnotationDocumentContext, MAX_VISIBLE_TEXT_LENGTH };
}

export { createAnnotationDocumentContext, MAX_VISIBLE_TEXT_LENGTH };
if (typeof module !== `undefined`) module.exports = { createAnnotationDocumentContext, MAX_VISIBLE_TEXT_LENGTH };
