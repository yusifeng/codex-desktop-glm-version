function runAnnotationCleanup(cleanup: (() => void) | null | undefined): void { if (cleanup != null) { try { cleanup(); } catch {} } }
export { runAnnotationCleanup };
if (typeof module !== `undefined`) module.exports = { runAnnotationCleanup };
