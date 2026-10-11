type AnnotationAnchorSelection = { primary: any; additional: any[] };

function mergeAnnotationAnchorSelection(current: AnnotationAnchorSelection, next: any, include: boolean, deps: { areEqual: (left: any, right: any) => boolean }): AnnotationAnchorSelection | null {
  if (current.primary.anchor.kind === `virtual` || next.anchor.kind === `virtual`) return include ? current : { additional: [], primary: next };
  if (!include) return { additional: [], primary: next };
  const anchors = [current.primary, ...current.additional];
  const index = anchors.findIndex((anchor) => deps.areEqual(anchor, next));
  if (index === -1) return { additional: [...current.additional, next], primary: current.primary };
  const [primary, ...additional] = anchors.filter((_anchor, anchorIndex) => anchorIndex !== index);
  return primary == null ? null : { additional, primary };
}

export { mergeAnnotationAnchorSelection };
if (typeof module !== `undefined`) module.exports = { mergeAnnotationAnchorSelection };
