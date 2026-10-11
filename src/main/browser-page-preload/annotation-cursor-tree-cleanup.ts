function cleanupAnnotationCursorStylesAcrossFrames(rootWindow: any, deps: { collectWindows: (rootWindow: any) => any[]; getDocument: (windowLike: any) => any; cleanupDocument: (documentLike: any) => void }): void { for (const windowLike of deps.collectWindows(rootWindow)) { const documentLike = deps.getDocument(windowLike); if (documentLike != null) deps.cleanupDocument(documentLike); } }
export { cleanupAnnotationCursorStylesAcrossFrames };
if (typeof module !== `undefined`) module.exports = { cleanupAnnotationCursorStylesAcrossFrames };
