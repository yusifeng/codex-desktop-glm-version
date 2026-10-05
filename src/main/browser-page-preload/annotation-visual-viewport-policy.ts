type VisualViewportLike = { offsetLeft: number; offsetTop: number; scale: number } | null | undefined;
/** Projects non-default visual viewport offsets into serializable state. */
function projectAnnotationVisualViewport(value: VisualViewportLike) {
  if (value == null || (value.offsetLeft === 0 && value.offsetTop === 0 && value.scale === 1)) return undefined;
  return { offsetLeft: value.offsetLeft, offsetTop: value.offsetTop, scale: value.scale };
}
export { projectAnnotationVisualViewport };
if (typeof module !== `undefined`) module.exports = { projectAnnotationVisualViewport };
