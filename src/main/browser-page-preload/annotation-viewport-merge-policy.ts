type ViewportSizedValue = { height: number; width: number; [key: string]: unknown };
type ViewportSize = { height: number; width: number };
/** Applies an optional viewport override while preserving all other fields. */
function mergeAnnotationViewportSize<T extends ViewportSizedValue>(value: T, viewport: ViewportSize | null): T {
  return viewport == null ? value : { ...value, height: viewport.height, width: viewport.width };
}
export { mergeAnnotationViewportSize };
if (typeof module !== `undefined`) module.exports = { mergeAnnotationViewportSize };
