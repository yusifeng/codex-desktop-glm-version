type AnnotationDocumentAnchor = { pageUrl?: unknown; documentContext?: { kind?: unknown } | null };
/** Recognizes anchors that belong to Google Docs or carry a parseable page URL. */
function isGoogleDocsAnnotationAnchor(anchor: AnnotationDocumentAnchor | null | undefined, parsePageUrl: (value: unknown) => unknown): boolean {
  return anchor?.documentContext?.kind === `google-docs` || parsePageUrl(anchor?.pageUrl) != null;
}
export { isGoogleDocsAnnotationAnchor };
if (typeof module !== `undefined`) module.exports = { isGoogleDocsAnnotationAnchor };
