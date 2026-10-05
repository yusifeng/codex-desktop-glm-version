type AnnotationScrollContainerSnapshot = { selector: string; scrollLeft: number; scrollTop: number };
function areAnnotationScrollContainersEqual(left: readonly AnnotationScrollContainerSnapshot[] | null | undefined, right: readonly AnnotationScrollContainerSnapshot[] | null | undefined): boolean { const a = left ?? []; const b = right ?? []; return a.length === b.length && a.every((entry, index) => { const other = b[index]; return other != null && entry.selector === other.selector && entry.scrollLeft === other.scrollLeft && entry.scrollTop === other.scrollTop; }); }
export { areAnnotationScrollContainersEqual };
if (typeof module !== `undefined`) module.exports = { areAnnotationScrollContainersEqual };
