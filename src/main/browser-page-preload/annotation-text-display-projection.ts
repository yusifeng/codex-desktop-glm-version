/** Projects a text annotation into the display shape while preserving source index. */
function projectAnnotationTextDisplay(annotation: any, textAnchor: any = null) {
  return {
    ...annotation,
    ...(textAnchor == null ? {} : { anchor: textAnchor }),
    selectionSourceIndexes: [0],
  };
}
export { projectAnnotationTextDisplay };
if (typeof module !== `undefined`) module.exports = { projectAnnotationTextDisplay };
