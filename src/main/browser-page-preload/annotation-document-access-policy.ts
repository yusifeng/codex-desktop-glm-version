function readAnnotationDocumentSafely(windowLike: any): any {
  try {
    return windowLike.document;
  } catch {
    return null;
  }
}
export { readAnnotationDocumentSafely };
if (typeof module !== `undefined`) module.exports = { readAnnotationDocumentSafely };
