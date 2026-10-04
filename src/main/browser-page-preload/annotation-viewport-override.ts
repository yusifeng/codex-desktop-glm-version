type ViewportSizedValue = { height: number; width: number; [key: string]: unknown };
type ViewportSize = { height: number; width: number };

function overrideAnnotationViewportSize<T extends ViewportSizedValue>(value: T, viewport: ViewportSize | null): T {
  return viewport == null ? value : { ...value, height: viewport.height, width: viewport.width };
}

export { overrideAnnotationViewportSize };
if (typeof module !== `undefined`) module.exports = { overrideAnnotationViewportSize };
