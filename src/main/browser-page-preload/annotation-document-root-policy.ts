function isAnnotationDocumentRoot(element: unknown, documentLike: { documentElement?: unknown; body?: unknown }): boolean { return element === documentLike.documentElement || element === documentLike.body; }
export { isAnnotationDocumentRoot };
if (typeof module !== `undefined`) module.exports = { isAnnotationDocumentRoot };
