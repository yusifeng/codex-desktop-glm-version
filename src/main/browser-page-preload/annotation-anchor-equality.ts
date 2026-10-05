function sameArray(left: readonly unknown[], right: readonly unknown[], equal: (a: any, b: any) => boolean = (a, b) => a === b): boolean { return left.length === right.length && left.every((value, index) => equal(value, right[index])); }
function sameScrollContainers(left: any[] | null | undefined, right: any[] | null | undefined): boolean { const a = left ?? []; const b = right ?? []; return a.length === b.length && a.every((entry, index) => { const other = b[index]; return other != null && entry.selector === other.selector && entry.scrollLeft === other.scrollLeft && entry.scrollTop === other.scrollTop; }); }
function areAnnotationAnchorsEqual(left: any, right: any): boolean {
  if (left.kind !== right.kind || left.pageUrl !== right.pageUrl || left.title !== right.title || left.elementPath !== right.elementPath || left.frameUrl !== right.frameUrl || !sameArray(left.framePath, right.framePath) || !sameScrollContainers(left.scrollContainers, right.scrollContainers) || left.isFixed !== right.isFixed || left.point.xPercent !== right.point.xPercent || left.point.y !== right.point.y || left.rect.x !== right.rect.x || left.rect.y !== right.rect.y || left.rect.width !== right.rect.width || left.rect.height !== right.rect.height || left.role !== right.role || left.name !== right.name || left.selector !== right.selector || left.nearbyText !== right.nearbyText) return false;
  switch (left.kind) {
    case `virtual`: return right.kind === `virtual` && left.surfaceId === right.surfaceId && left.targetId === right.targetId;
    case `element`: return right.kind === `element` && left.runtimeElementId === right.runtimeElementId;
    case `region`: return true;
    case `text`: return right.kind === `text` && left.selectedText === right.selectedText && left.textLocator.kind === right.textLocator.kind && left.textLocator.direction === right.textLocator.direction && (left.textLocator.kind === `form-control` || (right.textLocator.kind === `dom` && left.textLocator.rangeText === right.textLocator.rangeText)) && left.textLocator.selector === right.textLocator.selector && sameArray(left.textLocator.shadowHosts, right.textLocator.shadowHosts) && left.textLocator.startOffset === right.textLocator.startOffset && left.textLocator.endOffset === right.textLocator.endOffset && sameArray(left.selectionRects, right.selectionRects, (a, b) => b != null && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height);
    default: return false;
  }
}
export { areAnnotationAnchorsEqual };
if (typeof module !== `undefined`) module.exports = { areAnnotationAnchorsEqual };
