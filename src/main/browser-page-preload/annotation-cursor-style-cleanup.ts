function removeAnnotationCursorStyles(documentLike: any, deps: { restoreCursor: (documentLike: any) => void; queryAllStyles: (documentLike: any, attribute: string) => Iterable<{ remove: () => void }>; attribute: string }): void { deps.restoreCursor(documentLike); for (const style of deps.queryAllStyles(documentLike, deps.attribute)) style.remove(); }
export { removeAnnotationCursorStyles };
if (typeof module !== `undefined`) module.exports = { removeAnnotationCursorStyles };
