type ViewportSizedValue = { height: number; width: number; [key: string]: unknown };
type ViewportSize = { height: number; width: number };

function overrideAnnotationViewportSize<T extends ViewportSizedValue>(value: T, viewport: ViewportSize | null): T {
  return mergeAnnotationViewportSize(value, viewport);
}

export { overrideAnnotationViewportSize };
if (typeof module !== `undefined`) module.exports = { overrideAnnotationViewportSize };
import { mergeAnnotationViewportSize } from "./annotation-viewport-merge-policy";
