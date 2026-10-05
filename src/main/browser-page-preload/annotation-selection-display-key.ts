/** Builds the stable display key used for an annotation selection. */
function createAnnotationSelectionDisplayKey(selection: any, sourceIndex: number) {
  const anchor = selection.anchor;
  return `${anchor.kind}:${anchor.framePath.join(`>`)}:${anchor.selector ?? anchor.elementPath}:${anchor.rect.x}:${anchor.rect.y}:${sourceIndex}`;
}
export { createAnnotationSelectionDisplayKey };
if (typeof module !== `undefined`) module.exports = { createAnnotationSelectionDisplayKey };
