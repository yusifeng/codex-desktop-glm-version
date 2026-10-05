function getAnnotationScrollOffset(anchor: { kind: string; isFixed: boolean }, windowLike: { scrollX: number }): number { return anchor.kind === `text` && !anchor.isFixed ? windowLike.scrollX : 0; }
export { getAnnotationScrollOffset };
if (typeof module !== `undefined`) module.exports = { getAnnotationScrollOffset };
